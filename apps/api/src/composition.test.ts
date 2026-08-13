import { describe, expect, it, vi } from "vitest";
import { createApplication } from "./composition";
import * as persistenceModule from "./persistence";

vi.mock("./persistence", async () => {
  const actual = await vi.importActual<typeof import("./persistence")>("./persistence");
  return {
    ...actual,
    createPersistenceService: vi.fn(),
  };
});

describe("Phase 2.9 application composition root", () => {
  it("constructs the complete application capability set without persistence escape hatches", () => {
    const close = vi.fn();
    const query = {};
    const createWriter = vi.fn();
    vi.mocked(persistenceModule.createPersistenceService).mockReturnValue({
      query: query as never,
      createWriter,
      close,
    });

    const application = createApplication({ databaseUrl: "postgres://example" });

    expect(persistenceModule.createPersistenceService).toHaveBeenCalledWith({
      databaseUrl: "postgres://example",
    });
    expect(Object.keys(application).sort()).toEqual([
      "close",
      "commands",
      "createWriter",
      "ingestion",
      "query",
      "workflow",
    ]);
    expect(application.query).toEqual(query);
    expect(application.ingestion).toHaveProperty("ingest");
    expect(Object.keys(application.ingestion)).toEqual(["ingest"]);
    expect(application.ingestion).not.toHaveProperty("writer");
    expect(application.ingestion).not.toHaveProperty("unitOfWork");
    expect(application.ingestion).not.toHaveProperty("storage");
    expect(application.ingestion).not.toHaveProperty("pool");
    expect(application.ingestion).not.toHaveProperty("commit");
    expect(application.ingestion).not.toHaveProperty("rollback");
    expect(application.workflow).toHaveProperty("execute");
    expect(Object.keys(application.workflow)).toEqual(["execute"]);
    expect(application.workflow).not.toHaveProperty("writer");
    expect(application.workflow).not.toHaveProperty("unitOfWork");
    expect(application.workflow).not.toHaveProperty("storage");
    expect(application.workflow).not.toHaveProperty("pool");
    expect(application.workflow).not.toHaveProperty("commit");
    expect(application.workflow).not.toHaveProperty("rollback");
    expect(application.createWriter).toBeDefined();
    expect(application.close).toBeDefined();
    expect(application).not.toHaveProperty("storage");
    expect(application).not.toHaveProperty("unitOfWork");
    expect(application).not.toHaveProperty("pool");
  });
});
