import { describe, expect, it, vi } from "vitest";
import { createCommandService } from "./commands";

const id = "entity-1" as never;

const makeFactory = (failure: unknown) => vi.fn().mockRejectedValue(failure);

describe("Phase 2.8.3 command error boundary", () => {
  it("maps writer-factory failures to ApplicationError", async () => {
    const cause = new Error("database unavailable");
    const commands = createCommandService(makeFactory(cause));

    await expect(commands.createEntity(id)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });

  it("maps command writer failures to ApplicationError", async () => {
    const cause = new Error("write failed");
    const writer = {
      createEntity: vi.fn().mockRejectedValue(cause),
      createAssertion: vi.fn(),
      createRelationship: vi.fn(),
      createEvidence: vi.fn(),
      createMany: vi.fn(),
    };
    const commands = createCommandService(vi.fn().mockResolvedValue(writer as never));

    await expect(commands.createEntity(id)).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
      cause,
    });
  });
});
