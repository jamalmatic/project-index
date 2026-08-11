import { describe, expect, it } from "vitest";
import { createAssertion, createEntity, createRelationship } from "@project-index/domain";
import { assertionId, entityId, relationshipId } from "@project-index/core";
import { createMemoryUnitOfWork } from "./memory";
import { createQueryService } from "./query";

describe("Phase 2.6 query service", () => {
  it("reads persisted domain records through the read-only boundary", async () => {
    const uow = createMemoryUnitOfWork();
    const entity = createEntity({ id: entityId("entity-query"), type: "person" });
    const assertion = createAssertion({
      id: assertionId("assertion-query"),
      subject: entityId("entity-query"),
      predicate: "isA",
      object: "person",
    });
    const relationship = createRelationship({
      id: relationshipId("relationship-query"),
      subject: entityId("entity-query"),
      predicate: "relatedTo",
      object: entityId("entity-query"),
    });

    await uow.entities.save(entity);
    await uow.assertions.save(assertion);
    await uow.relationships.save(relationship);
    await uow.commit();

    const query = createQueryService(uow);

    await expect(query.entities.getById(entity.id)).resolves.toEqual(entity);
    await expect(query.assertions.getById(assertion.id)).resolves.toEqual(assertion);
    await expect(query.relationships.getById(relationship.id)).resolves.toEqual(relationship);
    await expect(query.entities.getById(entityId("missing"))).resolves.toBeNull();
  });

  it("does not expose persistence mutation or transaction operations", () => {
    const query = createQueryService(createMemoryUnitOfWork());
    expect(query.entities).not.toHaveProperty("save");
    expect(query.assertions).not.toHaveProperty("save");
    expect(query.relationships).not.toHaveProperty("save");
    expect(query.sources).not.toHaveProperty("save");
    expect(query.evidence).not.toHaveProperty("save");
    expect(query.derivations).not.toHaveProperty("save");
    expect(query.provenance).not.toHaveProperty("save");
    expect(query).not.toHaveProperty("commit");
    expect(query).not.toHaveProperty("rollback");
  });
});
