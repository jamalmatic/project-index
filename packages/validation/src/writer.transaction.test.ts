import { describe, expect, it, vi } from "vitest";
import type { UnitOfWork } from "@project-index/storage";
import { ValidatedWriter } from "./writer";

const makeUnitOfWork = (): UnitOfWork => ({
  entities: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
  assertions: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
  relationships: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
  sources: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
  evidence: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  },
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
});

describe("ValidatedWriter transaction semantics", () => {
  it("commits exactly once after a successful write", async () => {
    const unitOfWork = makeUnitOfWork();
    const writer = new ValidatedWriter({ unitOfWork });
    const input = { identity: "entity-1", type: "person", properties: {} } as never;

    await writer.createEntity(input);

    expect(unitOfWork.entities.save).toHaveBeenCalledOnce();
    expect(unitOfWork.commit).toHaveBeenCalledOnce();
    expect(unitOfWork.rollback).not.toHaveBeenCalled();
  });

  it("rolls back when persistence fails and does not commit", async () => {
    const unitOfWork = makeUnitOfWork();
    vi.mocked(unitOfWork.entities.save).mockRejectedValueOnce(new Error("save failed"));
    const writer = new ValidatedWriter({ unitOfWork });
    const input = { identity: "entity-1", type: "person", properties: {} } as never;

    await expect(writer.createEntity(input)).rejects.toThrow("save failed");

    expect(unitOfWork.commit).not.toHaveBeenCalled();
    expect(unitOfWork.rollback).toHaveBeenCalledOnce();
  });

  it("rolls back when commit fails and preserves the commit error", async () => {
    const unitOfWork = makeUnitOfWork();
    vi.mocked(unitOfWork.commit).mockRejectedValueOnce(new Error("commit failed"));
    const writer = new ValidatedWriter({ unitOfWork });
    const input = { identity: "entity-1", type: "person", properties: {} } as never;

    await expect(writer.createEntity(input)).rejects.toThrow("commit failed");

    expect(unitOfWork.commit).toHaveBeenCalledOnce();
    expect(unitOfWork.rollback).toHaveBeenCalledOnce();
  });
});
