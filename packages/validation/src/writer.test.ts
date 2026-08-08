import { describe, expect, it, vi } from "vitest";
import { ValidatedWriter, ValidationError } from "./writer";
import type { UnitOfWork } from "@project-index/storage";

const unitOfWork = (): UnitOfWork => ({
  entities: {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  assertions: {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  relationships: {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  sources: {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  evidence: {
    getById: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
  },
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
});

describe("ValidatedWriter write boundary", () => {
  it("does not persist or commit an invalid assertion", async () => {
    const uow = unitOfWork();
    const writer = new ValidatedWriter({ unitOfWork: uow });

    await expect(
      writer.createAssertion({
        id: "assertion-1",
        subject: "missing-subject",
        predicate: "depends-on",
        object: "missing-object",
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(uow.assertions.save).not.toHaveBeenCalled();
    expect(uow.commit).not.toHaveBeenCalled();
    expect(uow.rollback).not.toHaveBeenCalled();
  });

  it("does not persist or commit an invalid relationship", async () => {
    const uow = unitOfWork();
    const writer = new ValidatedWriter({ unitOfWork: uow });

    await expect(
      writer.createRelationship({
        id: "relationship-1",
        subject: "missing-subject",
        predicate: "depends-on",
        object: "missing-object",
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(uow.relationships.save).not.toHaveBeenCalled();
    expect(uow.commit).not.toHaveBeenCalled();
    expect(uow.rollback).not.toHaveBeenCalled();
  });

  it("rolls back when persistence fails", async () => {
    const uow = unitOfWork();
    vi.mocked(uow.entities.save).mockRejectedValueOnce(new Error("write failed"));
    const writer = new ValidatedWriter({ unitOfWork: uow });

    await expect(writer.createEntity({ id: "entity-1", type: "person" })).rejects.toThrow("write failed");

    expect(uow.entities.save).toHaveBeenCalledTimes(1);
    expect(uow.commit).not.toHaveBeenCalled();
    expect(uow.rollback).toHaveBeenCalledTimes(1);
  });
});
