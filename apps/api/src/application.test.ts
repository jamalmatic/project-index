import { describe, expect, it, vi } from "vitest";
import { createApplicationServices, type ApplicationServices } from "./application";

const makePersistence = () => ({
  query: { entities: {} } as ApplicationServices["query"],
  createWriter: vi.fn(),
  close: vi.fn(),
});

describe("Phase 2.7 application composition boundary", () => {
  it("exposes application capabilities without raw persistence storage", () => {
    const persistence = makePersistence();
    const services = createApplicationServices(persistence);

    expect(services.query).toBe(persistence.query);
    expect(services).not.toHaveProperty("storage");
    expect(services).not.toHaveProperty("unitOfWork");
    expect(services).not.toHaveProperty("pool");
  });

  it("delegates writer creation without exposing the UnitOfWork", async () => {
    const persistence = makePersistence();
    const writer = { write: vi.fn() };
    persistence.createWriter.mockResolvedValue(writer);

    const services = createApplicationServices(persistence);
    await expect(services.createWriter()).resolves.toBe(writer);
    expect(persistence.createWriter).toHaveBeenCalledWith(undefined);
  });
});
