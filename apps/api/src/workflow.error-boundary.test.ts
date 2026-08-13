import { describe, expect, it, vi } from "vitest";
import { createApplicationServices } from "./application";
import { ApplicationError } from "./errors";

const makePersistence = () => ({
  query: {
    sources: { getById: vi.fn() },
    entities: { getById: vi.fn() },
    assertions: { getById: vi.fn() },
    relationships: { getById: vi.fn() },
    evidence: { getById: vi.fn() },
    provenance: { getById: vi.fn() },
  },
  createWriter: vi.fn(),
  close: vi.fn(),
});

const makeIngestion = () => ({
  ingest: vi.fn(),
});

describe("Phase 2.9.2 workflow error boundary", () => {
  it("maps ingestion failures to ApplicationError and does not start read-back", async () => {
    const persistence = makePersistence();
    const cause = new Error("ingestion write failed");
    const ingestion = makeIngestion();
    ingestion.ingest.mockRejectedValue(cause);

    const services = createApplicationServices({
      ...persistence,
      query: persistence.query,
      createWriter: persistence.createWriter,
      close: persistence.close,
    } as never);
    const workflow = services.workflow;
    const input = {} as never;

    await expect(workflow.execute(input)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });

    expect(ingestion.ingest).not.toHaveBeenCalled();
  });

  it("maps post-commit read-back failures to ApplicationError", async () => {
    const persistence = makePersistence();
    const cause = new Error("read-back unavailable");
    persistence.createWriter.mockResolvedValue({} as never);
    persistence.query.sources.getById.mockRejectedValue(cause);

    const services = createApplicationServices(persistence as never);

    // Replace the application ingestion capability with a successful result so
    // this test isolates the post-ingestion query phase.
    const successfulIngestion = {
      source: { id: "source-1" },
      entities: [],
      assertions: [],
      relationships: [],
      evidence: [],
      provenance: [],
    } as never;
    const application = {
      ...services,
      ingestion: { ingest: vi.fn().mockResolvedValue(successfulIngestion) },
    } as typeof services;

    await expect(application.workflow.execute({} as never)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });

  it("preserves an existing ApplicationError without wrapping it again", async () => {
    const persistence = makePersistence();
    const cause = new ApplicationError("STORAGE_ERROR", "already classified");
    const services = createApplicationServices(persistence as never);
    const application = {
      ...services,
      ingestion: { ingest: vi.fn().mockRejectedValue(cause) },
    } as typeof services;

    await expect(application.workflow.execute({} as never)).rejects.toBe(cause);
  });
});
