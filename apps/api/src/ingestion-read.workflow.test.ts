import { describe, expect, it, vi } from "vitest";
import type { IngestionResult } from "@project-index/validation";
import { createIngestionReadWorkflow } from "./ingestion-read.workflow";

const result = {
  source: { id: "source-1", kind: "repository" },
  entities: [{ id: "entity-1" }],
  assertions: [{ id: "assertion-1" }],
  relationships: [{ id: "relationship-1" }],
  evidence: [{ id: "evidence-1" }],
  provenance: [{ id: "provenance-1" }],
} as unknown as IngestionResult;

describe("Phase 2.9.1 ingestion read-back workflow", () => {
  const makeQuery = () => ({
    sources: { getById: vi.fn().mockResolvedValue(result.source) },
    entities: { getById: vi.fn().mockResolvedValue(result.entities[0]) },
    assertions: { getById: vi.fn().mockResolvedValue(result.assertions[0]) },
    relationships: { getById: vi.fn().mockResolvedValue(result.relationships[0]) },
    evidence: { getById: vi.fn().mockResolvedValue(result.evidence[0]) },
    provenance: { getById: vi.fn().mockResolvedValue(result.provenance[0]) },
  });

  it("performs ingestion first and reads the committed records back through unified query", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const input = { source: { id: "source-1", kind: "repository" } } as never;
    const output = await workflow.execute(input);

    expect(ingestion.ingest).toHaveBeenCalledWith(input);
    expect(output).toEqual({
      ingestion: result,
      readBack: {
        source: result.source,
        entities: [result.entities[0]],
        assertions: [result.assertions[0]],
        relationships: [result.relationships[0]],
        evidence: [result.evidence[0]],
        provenance: [result.provenance[0]],
      },
    });
  });

  it("returns a stable application result shape without persistence or transaction capabilities", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const output = await workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);

    expect(Object.keys(output).sort()).toEqual(["ingestion", "readBack"]);
    expect(Object.keys(output.readBack).sort()).toEqual([
      "assertions",
      "entities",
      "evidence",
      "provenance",
      "relationships",
      "source",
    ]);
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
    const gates = Array.from({ length: 6 }, () => {
      let resolve!: (value: unknown) => void;
      const promise = new Promise((res) => {
        resolve = res;
      });
      return { promise, resolve };
    });
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

    sourceGate.resolve(result.source);
    entityGate.resolve(result.entities[0]);
    assertionGate.resolve(result.assertions[0]);
    relationshipGate.resolve(result.relationships[0]);
    evidenceGate.resolve(result.evidence[0]);
    provenanceGate.resolve(result.provenance[0]);

    await expect(execution).resolves.toBeDefined();
  });

  it("fails the whole workflow when any child read-back rejects", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const cause = new Error("assertion read failed");
    query.assertions.getById.mockRejectedValue(cause);

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });

    await expect(
      workflow.execute({ source: { id: "source-1", kind: "repository" } } as never),
    ).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      message: "assertion read failed",
      cause,
    });
  });

  it("fails the whole workflow when any child read-back is missing", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockResolvedValue(null);

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });

    await expect(
      workflow.execute({ source: { id: "source-1", kind: "repository" } } as never),
    ).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      message: "Committed entity entity-1 was not found during workflow read-back",
    });
  });

  it("maps ingestion failures to the application error boundary without querying", async () => {
    const cause = new Error("validation failed");
    const ingestion = { ingest: vi.fn().mockRejectedValue(cause) };
    const query = {
      sources: { getById: vi.fn() },
      entities: { getById: vi.fn() },
      assertions: { getById: vi.fn() },
      relationships: { getById: vi.fn() },
      evidence: { getById: vi.fn() },
      provenance: { getById: vi.fn() },
    };

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });

    await expect(
      workflow.execute({ source: { id: "source-1", kind: "repository" } } as never),
    ).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      message: "validation failed",
    });
    expect(query.sources.getById).not.toHaveBeenCalled();
  });
});
