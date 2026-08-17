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
    const gates = {
      source: makeGate(),
      entity1: makeGate(), entity2: makeGate(),
      assertion1: makeGate(), assertion2: makeGate(),
      relationship1: makeGate(), relationship2: makeGate(),
      evidence1: makeGate(), evidence2: makeGate(),
      provenance1: makeGate(), provenance2: makeGate(),
    };
    query.sources.getById.mockImplementation(() => gates.source.promise as never);
    query.entities.getById.mockImplementation((id: string) => (id === "entity-1" ? gates.entity1.promise : gates.entity2.promise) as never);
    query.assertions.getById.mockImplementation((id: string) => (id === "assertion-1" ? gates.assertion1.promise : gates.assertion2.promise) as never);
    query.relationships.getById.mockImplementation((id: string) => (id === "relationship-1" ? gates.relationship1.promise : gates.relationship2.promise) as never);
    query.evidence.getById.mockImplementation((id: string) => (id === "evidence-1" ? gates.evidence1.promise : gates.evidence2.promise) as never);
    query.provenance.getById.mockImplementation((id: string) => (id === "provenance-1" ? gates.provenance1.promise : gates.provenance2.promise) as never);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const execution = workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    await vi.waitFor(() => {
      expect(query.sources.getById).toHaveBeenCalledWith("source-1");
      expect(query.entities.getById).toHaveBeenCalledWith("entity-1");
      expect(query.entities.getById).toHaveBeenCalledWith("entity-2");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-1");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-2");
      expect(query.relationships.getById).toHaveBeenCalledWith("relationship-1");
      expect(query.relationships.getById).toHaveBeenCalledWith("relationship-2");
      expect(query.evidence.getById).toHaveBeenCalledWith("evidence-1");
      expect(query.evidence.getById).toHaveBeenCalledWith("evidence-2");
      expect(query.provenance.getById).toHaveBeenCalledWith("provenance-1");
      expect(query.provenance.getById).toHaveBeenCalledWith("provenance-2");
    });
    gates.source.resolve(result.source);
    gates.entity1.resolve(result.entities[0]); gates.entity2.resolve(result.entities[1]);
    gates.assertion1.resolve(result.assertions[0]); gates.assertion2.resolve(result.assertions[1]);
    gates.relationship1.resolve(result.relationships[0]); gates.relationship2.resolve(result.relationships[1]);
    gates.evidence1.resolve(result.evidence[0]); gates.evidence2.resolve(result.evidence[1]);
    gates.provenance1.resolve(result.provenance[0]); gates.provenance2.resolve(result.provenance[1]);
    await expect(execution).resolves.toBeDefined();
  });

  it("rejects a successful read-back when any returned record has the wrong identity", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockImplementation(() => result.entities[0]);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR" });
  });

  it("rejects identity mismatches for the source as well", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.sources.getById.mockResolvedValue({ id: "source-wrong", kind: "repository" });
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR" });
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
