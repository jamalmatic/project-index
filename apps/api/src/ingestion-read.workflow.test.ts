import { describe, expect, it, vi } from "vitest";
import type { IngestionResult } from "@project-index/validation";
import { createIngestionReadWorkflow } from "./ingestion-read.workflow";

const result = {
  source: { id: "source-1", kind: "repository" },
  entities: [{ id: "entity-1" }, { id: "entity-2" }],
  assertions: [{ id: "assertion-1" }, { id: "assertion-2" }],
  relationships: [{ id: "relationship-1" }, { id: "relationship-2" }],
  evidence: [{ id: "evidence-1" }, { id: "evidence-2" }],
  provenance: [{ id: "provenance-1" }, { id: "provenance-2" }],
} as unknown as IngestionResult;

describe("Phase 2.9 ingestion read-back workflow", () => {
  const makeQuery = () => ({
    sources: { getById: vi.fn().mockResolvedValue(result.source) },
    entities: { getById: vi.fn((id: string) => result.entities.find((value) => value.id === id)) },
    assertions: { getById: vi.fn((id: string) => result.assertions.find((value) => value.id === id)) },
    relationships: { getById: vi.fn((id: string) => result.relationships.find((value) => value.id === id)) },
    evidence: { getById: vi.fn((id: string) => result.evidence.find((value) => value.id === id)) },
    provenance: { getById: vi.fn((id: string) => result.provenance.find((value) => value.id === id)) },
  });

  it("performs ingestion first and reads committed records back", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const input = { source: { id: "source-1", kind: "repository" } } as never;
    const output = await workflow.execute(input);
    expect(ingestion.ingest).toHaveBeenCalledWith(input);
    expect(output.readBack.source).toEqual(result.source);
    expect(output.readBack.entities).toEqual(result.entities);
    expect(output.readBack.assertions).toEqual(result.assertions);
    expect(output.readBack.relationships).toEqual(result.relationships);
    expect(output.readBack.evidence).toEqual(result.evidence);
    expect(output.readBack.provenance).toEqual(result.provenance);
  });

  it("returns a stable application result shape without persistence escape hatches", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const output = await workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    expect(Object.keys(output).sort()).toEqual(["ingestion", "readBack"]);
    expect(Object.keys(output.readBack).sort()).toEqual(["assertions", "entities", "evidence", "provenance", "relationships", "source"]);
    expect(output).not.toHaveProperty("storage");
    expect(output).not.toHaveProperty("pool");
    expect(output).not.toHaveProperty("unitOfWork");
    expect(output).not.toHaveProperty("transaction");
    expect(output).not.toHaveProperty("commit");
    expect(output).not.toHaveProperty("rollback");
  });

  it("starts all independent read-back branches before any branch resolves", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    function makeGate() { let resolve!: (value: unknown) => void; const promise = new Promise((res) => { resolve = res; }); return { promise, resolve }; }
    type Gate = ReturnType<typeof makeGate>;
    const gates: [Gate, Gate, Gate, Gate, Gate, Gate] = [makeGate(), makeGate(), makeGate(), makeGate(), makeGate(), makeGate()];
    const [sourceGate, entityGate, assertionGate, relationshipGate, evidenceGate, provenanceGate] = gates;
    query.sources.getById.mockReturnValue(sourceGate.promise);
    query.entities.getById.mockReturnValue(entityGate.promise);
    query.assertions.getById.mockReturnValue(assertionGate.promise);
    query.relationships.getById.mockReturnValue(relationshipGate.promise);
    query.evidence.getById.mockReturnValue(evidenceGate.promise);
    query.provenance.getById.mockReturnValue(provenanceGate.promise);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const execution = workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    await vi.waitFor(() => {
      expect(query.sources.getById).toHaveBeenCalledWith("source-1");
      expect(query.entities.getById).toHaveBeenCalledWith("entity-1");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-1");
      expect(query.relationships.getById).toHaveBeenCalledWith("relationship-1");
      expect(query.evidence.getById).toHaveBeenCalledWith("evidence-1");
      expect(query.provenance.getById).toHaveBeenCalledWith("provenance-1");
    });
    sourceGate.resolve(result.source); entityGate.resolve(result.entities[0]); assertionGate.resolve(result.assertions[0]); relationshipGate.resolve(result.relationships[0]); evidenceGate.resolve(result.evidence[0]); provenanceGate.resolve(result.provenance[0]);
    await expect(execution).resolves.toBeDefined();
  });

  it("rejects a successful read-back when any returned record has the wrong identity", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockResolvedValue({ id: "entity-wrong" });
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR", message: "Committed entity entity-1 was read back as entity-wrong" });
  });

  it("rejects identity mismatches for the source as well", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.sources.getById.mockResolvedValue({ id: "source-wrong", kind: "repository" });
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR", message: "Committed source source-1 was read back as source-wrong" });
  });

  it("reads back exactly the committed identities and never widens query scope", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await workflow.execute({ source: { id: "input-source-that-must-not-be-queried", kind: "repository" } } as never);
    expect(query.sources.getById).toHaveBeenCalledTimes(1);
    expect(query.sources.getById).toHaveBeenLastCalledWith("source-1");
    expect(query.entities.getById).toHaveBeenCalledTimes(2);
    expect(query.assertions.getById).toHaveBeenCalledTimes(2);
    expect(query.relationships.getById).toHaveBeenCalledTimes(2);
    expect(query.evidence.getById).toHaveBeenCalledTimes(2);
    expect(query.provenance.getById).toHaveBeenCalledTimes(2);
  });

  it("preserves committed collection order and cardinality during read-back", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const output = await workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    expect(output.readBack.entities.map((value) => value.id)).toEqual(result.entities.map((value) => value.id));
    expect(output.readBack.assertions.map((value) => value.id)).toEqual(result.assertions.map((value) => value.id));
    expect(output.readBack.relationships.map((value) => value.id)).toEqual(result.relationships.map((value) => value.id));
    expect(output.readBack.evidence.map((value) => value.id)).toEqual(result.evidence.map((value) => value.id));
    expect(output.readBack.provenance.map((value) => value.id)).toEqual(result.provenance.map((value) => value.id));
  });

  it("fails when a committed collection item is missing from read-back", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockImplementation((id: string) => id === "entity-1" ? result.entities[0] : undefined);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR" });
  });

  it("fails the whole workflow when any child read-back rejects", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const cause = new Error("assertion read failed");
    query.assertions.getById.mockRejectedValue(cause);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR", message: "assertion read failed", cause });
  });

  it("maps ingestion failures to the application error boundary without querying", async () => {
    const cause = new Error("validation failed");
    const ingestion = { ingest: vi.fn().mockRejectedValue(cause) };
    const query = { sources: { getById: vi.fn() }, entities: { getById: vi.fn() }, assertions: { getById: vi.fn() }, relationships: { getById: vi.fn() }, evidence: { getById: vi.fn() }, provenance: { getById: vi.fn() } };
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR", message: "validation failed" });
    expect(query.sources.getById).not.toHaveBeenCalled();
  });
});
