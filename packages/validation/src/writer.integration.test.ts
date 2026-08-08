import { describe, expect, it } from "vitest";
import { createMemoryUnitOfWork } from "@project-index/storage";
import { ValidationError, ValidatedWriter } from "./writer";

describe("ValidatedWriter end-to-end persistence contracts", () => {
  it("persists a valid entity through the complete write boundary", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const writer = new ValidatedWriter({ unitOfWork });

    const entity = await writer.createEntity({ id: "entity-1", type: "person" });

    expect(await unitOfWork.entities.getById(entity.id)).toEqual(entity);
  });

  it("leaves repository state unchanged when an assertion reference is invalid", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const writer = new ValidatedWriter({ unitOfWork });

    await expect(
      writer.createAssertion({
        id: "assertion-1",
        subject: "missing-subject",
        predicate: "depends-on",
        object: "missing-object",
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(await unitOfWork.assertions.getById("assertion-1" as never)).toBeNull();
  });

  it("persists a valid batch and commits it as one operation", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const writer = new ValidatedWriter({ unitOfWork });

    const result = await writer.createMany([
      { kind: "entity", input: { id: "entity-1", type: "person" } },
      { kind: "entity", input: { id: "entity-2", type: "organization" } },
    ]);

    expect(result).toHaveLength(2);
    expect(await unitOfWork.entities.getById("entity-1" as never)).toEqual(result[0]);
    expect(await unitOfWork.entities.getById("entity-2" as never)).toEqual(result[1]);
  });

  it("does not persist any member of a batch when one operation is invalid", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const writer = new ValidatedWriter({ unitOfWork });

    await expect(
      writer.createMany([
        { kind: "entity", input: { id: "entity-1", type: "person" } },
        {
          kind: "assertion",
          input: {
            id: "assertion-1",
            subject: "missing-subject",
            predicate: "depends-on",
            object: "missing-object",
          },
        },
      ]),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(await unitOfWork.entities.getById("entity-1" as never)).toBeNull();
    expect(await unitOfWork.assertions.getById("assertion-1" as never)).toBeNull();
  });
});
