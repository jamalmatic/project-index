import { describe, expect, it, vi } from "vitest";
import { createApplicationServices, type ApplicationServices } from "./application";
import type { PersistenceService } from "./persistence";

describe("Phase 2.9 application contract", () => {
  it("extends the locked Phase 2.8 contract with the workflow capability and no persistence escape hatch", () => {
    const persistence = {
      query: {} as ApplicationServices["query"],
      createWriter: vi.fn(),
      close: vi.fn(),
      storage: { pool: {} },
    } as unknown as PersistenceService;

    const services = createApplicationServices(persistence);
    const keys = Object.keys(services).sort();

    expect(keys).toEqual(["close", "commands", "createWriter", "ingestion", "query", "workflow"]);
    expect(Object.keys(services.workflow)).toEqual(["execute"]);
    expect(services).not.toHaveProperty("storage");
    expect(services).not.toHaveProperty("unitOfWork");
    expect(services).not.toHaveProperty("pool");
    expect(services.workflow).not.toHaveProperty("writer");
    expect(services.workflow).not.toHaveProperty("unitOfWork");
    expect(services.workflow).not.toHaveProperty("storage");
    expect(services.workflow).not.toHaveProperty("pool");
  });

  it("keeps the application contract structurally independent of PersistenceService", () => {
    type ExpectedKeys = keyof ApplicationServices;
    const expected: ExpectedKeys[] = ["query", "commands", "createWriter", "ingestion", "workflow", "close"];
    expect(expected.sort()).toEqual(["close", "commands", "createWriter", "ingestion", "query", "workflow"]);
  });
});
