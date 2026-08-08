import { describe, expect, it } from "vitest";
import { createEntity } from "@project-index/domain";
import { entityId } from "@project-index/core";
import { createMemoryUnitOfWork } from "./memory";
import type { UnitOfWork } from "./repository";

const exerciseUnitOfWork = async (create: () => Promise<UnitOfWork> | UnitOfWork) => {
  const unit = await create();
  const entity = createEntity({ id: "entity-1", type: "concept" });
  await unit.entities.save(entity);
  expect(await unit.entities.getById(entity.id)).toBe(entity);
  await unit.commit();
  await unit.commit();
  await unit.rollback();
};

describe("persistence contract", () => {
  it("requires a unit of work to expose all repositories and transaction controls", async () => {
    const unit = createMemoryUnitOfWork();
    expect(unit.entities).toBeDefined();
    expect(unit.assertions).toBeDefined();
    expect(unit.relationships).toBeDefined();
    expect(unit.sources).toBeDefined();
    expect(unit.evidence).toBeDefined();
    expect(unit.commit).toBeTypeOf("function");
    expect(unit.rollback).toBeTypeOf("function");
  });

  it("keeps repeated transaction completion safe", async () => {
    await expect(exerciseUnitOfWork(createMemoryUnitOfWork)).resolves.toBeUndefined();
  });

  it("returns null for an unknown identifier", async () => {
    const unit = createMemoryUnitOfWork();
    expect(await unit.entities.getById(entityId("missing"))).toBeNull();
    await unit.rollback();
  });
});
