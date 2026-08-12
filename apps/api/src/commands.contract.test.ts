import { describe, expect, it, vi } from "vitest";
import { createCommandService } from "./commands";

describe("Phase 2.8.4 command contract", () => {
  it("exposes only command capabilities", () => {
    const commands = createCommandService(vi.fn());
    expect(Object.keys(commands).sort()).toEqual([
      "createAssertion",
      "createEntity",
      "createEvidence",
      "createRelationship",
      "createSource",
    ]);
    expect(commands).not.toHaveProperty("writer");
    expect(commands).not.toHaveProperty("unitOfWork");
    expect(commands).not.toHaveProperty("storage");
    expect(commands).not.toHaveProperty("pool");
    expect(commands).not.toHaveProperty("commit");
    expect(commands).not.toHaveProperty("rollback");
  });

  it("does not require a persistence-shaped object at construction time", () => {
    const createWriter = vi.fn();
    const commands = createCommandService(createWriter);

    expect(commands).toBeDefined();
    expect(createWriter).not.toHaveBeenCalled();
  });
});
