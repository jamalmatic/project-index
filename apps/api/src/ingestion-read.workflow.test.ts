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
  it("performs ingestion first and reads the committed records back through unified query", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = {
      sources: { getById: vi.fn().mockResolvedValue(result.source) },
      entities: { getById: vi.fn().mockResolvedValue(result.entities[0]) },
      assertions: { getById: vi.fn().mockResolvedValue(result.assertions[0]) },
      relationships: { getById: vi.fn().mockResolvedValue(result.relationships[0]) },
      evidence: { getById: vi.fn().mockResolvedValue(result.evidence[0]) },
      provenance: { getById: vi.fn().mockResolvedValue(result.provenance[0]) },
    } as never;

    const workflow = createIngestionReadWorkflow({ ingestion, query });
    const input = { source: { id: "source-1", kind: "repository" } } as never;
    const output = await workflow.execute(input);

    expect(ingestion.ingest).toHaveBeenCalledWith(input);
    expect(query.sources.getById).toHaveBeenCalledWith("source-1");
    expect(query.entities.getById).toHaveBeenCalledWith("entity-1");
    expect(query.assertions.getById).toHaveBeenCalledWith("assertion-1");
    expect(query.relationships.getById).toHaveBeenCalledWith("relationship-1");
    expect(query.evidence.getById).toHaveBeenCalledWith("evidence-1");
    expect(query.provenance.getById).toHaveBeenCalledWith("provenance-1");
    expect(output).toEqual({ ingestion: result, readBack: result });
  });

  it("does not expose writer or transaction capabilities", () => {
    const workflow = createIngestionReadWorkflow({
      ingestion: { ingest: vi.fn() },
      query: {} as never,
    });

    expect(Object.keys(workflow)).toEqual(["execute"]);
    expect(workflow).not.toHaveProperty("writer");
    expect(workflow).not.toHaveProperty("unitOfWork");
    expect(workflow).not.toHaveProperty("storage");
    expect(workflow).not.toHaveProperty("pool");
    expect(workflow).not.toHaveProperty("commit");
    expect(workflow).not.toHaveProperty("rollback");
  });

  it("does not query when ingestion fails", async () => {
    const cause = new Error("validation failed");
    const ingestion = { ingest: vi.fn().mockRejectedValue(cause) };
    const query = {
      sources: { getById: vi.fn() },
      entities: { getById: vi.fn() },
      assertions: { getById: vi.fn() },
      relationships: { getById: vi.fn() },
      evidence: { getById: vi.fn() },
      provenance: { getById: vi.fn() },
    } as never;

    const workflow = createIngestionReadWorkflow({ ingestion, query });

    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toBe(cause);
    expect(query.sources.getById).not.toHaveBeenCalled();
  });
});
