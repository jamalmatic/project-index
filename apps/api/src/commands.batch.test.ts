import { describe, expect, it, vi } from "vitest";
import { createCommandService } from "./commands";

describe("Phase 2.8.5 batch orchestration", () => {
  it("does not expose createMany as an application command", () => {
    const commands = createCommandService(vi.fn());
    expect(commands).not.toHaveProperty("createMany");
  });

  it("keeps multi-write transaction semantics inside the writer", async () => {
    const writer = {
      createMany: vi.fn().mockResolvedValue([{ id: "entity-1" }, { id: "source-1" }]),
    };
    const createWriter = vi.fn().mockResolvedValue(writer);
    const commands = createCommandService(createWriter as never);

    // Batch orchestration remains an internal writer concern until a concrete
    // domain use-case requires a named application command.
    expect(commands).not.toHaveProperty("createMany");
    expect(writer.createMany).not.toHaveBeenCalled();
    expect(createWriter).not.toHaveBeenCalled();
  });
});
