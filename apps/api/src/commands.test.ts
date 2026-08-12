import { describe, expect, it, vi } from "vitest";
import { createCommandService } from "./commands";

const makeWriter = () => ({
  createEntity: vi.fn(),
  createAssertion: vi.fn(),
  createRelationship: vi.fn(),
  createEvidence: vi.fn(),
  createMany: vi.fn(),
});

describe("Phase 2.8 command service", () => {
  it("delegates commands to the validated writer capability", async () => {
    const writer = makeWriter();
    const entityInput = {};
    const assertionInput = {};
    const relationshipInput = {};
    const evidenceInput = {};
    const sourceInput = {};
    const entity = { id: "entity" };
    const assertion = { id: "assertion" };
    const relationship = { id: "relationship" };
    const evidence = { id: "evidence" };
    const source = { id: "source" };

    writer.createEntity.mockResolvedValue(entity);
    writer.createAssertion.mockResolvedValue(assertion);
    writer.createRelationship.mockResolvedValue(relationship);
    writer.createEvidence.mockResolvedValue(evidence);
    writer.createMany.mockResolvedValue([source]);

    const createWriter = vi.fn().mockResolvedValue(writer);
    const commands = createCommandService(createWriter);

    await expect(commands.createEntity(entityInput as never)).resolves.toBe(entity);
    await expect(commands.createAssertion(assertionInput as never)).resolves.toBe(assertion);
    await expect(commands.createRelationship(relationshipInput as never)).resolves.toBe(relationship);
    await expect(commands.createEvidence(evidenceInput as never)).resolves.toBe(evidence);
    await expect(commands.createSource(sourceInput as never)).resolves.toBe(source);

    expect(createWriter).toHaveBeenCalledTimes(5);
    expect(writer.createEntity).toHaveBeenCalledWith(entityInput);
    expect(writer.createAssertion).toHaveBeenCalledWith(assertionInput);
    expect(writer.createRelationship).toHaveBeenCalledWith(relationshipInput);
    expect(writer.createEvidence).toHaveBeenCalledWith(evidenceInput);
    expect(writer.createMany).toHaveBeenCalledWith([{ kind: "source", input: sourceInput }]);
  });

  it("does not expose the writer or transaction boundary", () => {
    const commands = createCommandService(vi.fn() as never);
    expect(commands).not.toHaveProperty("writer");
    expect(commands).not.toHaveProperty("unitOfWork");
    expect(commands).not.toHaveProperty("commit");
    expect(commands).not.toHaveProperty("rollback");
  });
});
