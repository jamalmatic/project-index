import { describe, expect, it, vi } from "vitest";
import { createApplicationServices } from "./application";

describe("Phase 2.8.8 application ingestion boundary", () => {
  it("exposes only the ingestion capability, not its writer or transaction boundary", () => {
    const persistence = {
      query: {} as never,
      createWriter: vi.fn(),
      close: vi.fn(),
    };
    const services = createApplicationServices(persistence as never);

    expect(Object.keys(services.ingestion).sort()).toEqual(["ingest"]);
    expect(services.ingestion).not.toHaveProperty("writer");
    expect(services.ingestion).not.toHaveProperty("unitOfWork");
    expect(services.ingestion).not.toHaveProperty("storage");
    expect(services.ingestion).not.toHaveProperty("pool");
    expect(services.ingestion).not.toHaveProperty("commit");
    expect(services.ingestion).not.toHaveProperty("rollback");
    expect(persistence.createWriter).not.toHaveBeenCalled();
  });

  it("maps ingestion failures to ApplicationError", async () => {
    const cause = new Error("ingestion unavailable");
    const writer = { createMany: vi.fn().mockRejectedValue(cause) };
    const persistence = {
      query: {} as never,
      createWriter: vi.fn().mockResolvedValue(writer),
      close: vi.fn(),
    };
    const services = createApplicationServices(persistence as never);

    await expect(services.ingestion.ingest({ source: { id: "source-1", kind: "repository" } })).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });
});
