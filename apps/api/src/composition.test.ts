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

describe("Phase 2.7 application composition root", () => {
  it("constructs application capabilities from persistence configuration", () => {
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
    expect(application.query).toBe(query);
    expect(application.createWriter).toBeDefined();
    expect(application.close).toBeDefined();
    expect(application).not.toHaveProperty("storage");
    expect(application).not.toHaveProperty("unitOfWork");
  });
});
