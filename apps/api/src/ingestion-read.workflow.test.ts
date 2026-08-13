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
