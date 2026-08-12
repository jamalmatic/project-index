import { describe, expect, it, vi } from "vitest";
import { createApplicationServices } from "./application";

const makePersistence = () => ({
  query: {
    entities: {
      getById: vi.fn(),
    },
  },
  createWriter: vi.fn(),
  close: vi.fn(),
});

describe("Phase 2.7 application error boundary", () => {
  it("maps synchronous query failures to an application error", async () => {
    const persistence = makePersistence();
    const cause = new Error("connection refused");
    persistence.query.entities.getById.mockImplementation(() => {
      throw cause;
    });

    const services = createApplicationServices(persistence as never);
    const id = "entity-1" as Parameters<typeof persistence.query.entities.getById>[0];

    const result = Promise.resolve().then(() => services.query.entities.getById(id));
    await expect(result).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });

  it("maps asynchronous query failures to an application error", async () => {
    const persistence = makePersistence();
    const cause = new Error("database unavailable");
    persistence.query.entities.getById.mockRejectedValue(cause);

    const services = createApplicationServices(persistence as never);
    const id = "entity-1" as Parameters<typeof persistence.query.entities.getById>[0];

    const result = Promise.resolve().then(() => services.query.entities.getById(id));
    await expect(result).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });
});
