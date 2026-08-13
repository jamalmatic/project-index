import { describe, expect, it, vi } from "vitest";
import { createIngestionReadWorkflow } from "./ingestion-read.workflow";
import { ApplicationError } from "./errors";

const makeQuery = () => ({
  sources: { getById: vi.fn() },
  entities: { getById: vi.fn() },
  assertions: { getById: vi.fn() },
  relationships: { getById: vi.fn() },
  evidence: { getById: vi.fn() },
  provenance: { getById: vi.fn() },
});

const successfulIngestion = {
  source: { id: "source-1" },
  entities: [{ id: "entity-1" }],
  assertions: [{ id: "assertion-1" }],
  relationships: [{ id: "relationship-1" }],
  evidence: [{ id: "evidence-1" }],
  provenance: [{ id: "provenance-1" }],
} as never;

describe("Phase 2.9.2 workflow error boundary", () => {
  it("maps ingestion failures to ApplicationError and does not start read-back", async () => {
    const query = makeQuery();
    const cause = new Error("ingestion write failed");
    const ingestion = { ingest: vi.fn().mockRejectedValue(cause) };
    const workflow = createIngestionReadWorkflow({ query: query as never, ingestion });

    await expect(workflow.execute({} as never)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });

    expect(query.sources.getById).not.toHaveBeenCalled();
    expect(query.entities.getById).not.toHaveBeenCalled();
    expect(query.assertions.getById).not.toHaveBeenCalled();
  });

  it("maps post-commit read-back failures to ApplicationError", async () => {
    const query = makeQuery();
    const cause = new Error("read-back unavailable");
    query.sources.getById.mockRejectedValue(cause);
    const ingestion = { ingest: vi.fn().mockResolvedValue(successfulIngestion) };
    const workflow = createIngestionReadWorkflow({ query: query as never, ingestion });

    await expect(workflow.execute({} as never)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });

  it("preserves an existing ApplicationError without wrapping it again", async () => {
    const query = makeQuery();
    const cause = new ApplicationError("STORAGE_ERROR", "already classified");
    const ingestion = { ingest: vi.fn().mockRejectedValue(cause) };
    const workflow = createIngestionReadWorkflow({ query: query as never, ingestion });

    await expect(workflow.execute({} as never)).rejects.toBe(cause);
  });
});
