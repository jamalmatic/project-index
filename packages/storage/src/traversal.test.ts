import { describe, expect, it } from "vitest";
import { createAssertion, createEntity, createRelationship } from "@project-index/domain";
import { entityId } from "@project-index/core";
import { createQueryTraversalService } from "./traversal";

describe("Phase 2.6 canonical query traversal", () => {
  const entity1 = createEntity({ id: "entity-b", type: "person" });
  const entity2 = createEntity({ id: "entity-a", type: "person" });
  const entity3 = createEntity({ id: "entity-c", type: "repository" });

  const assertions = [
    createAssertion({ id: "assertion-b", subject: entity1.id, predicate: "knows", object: entity3.id }),
    createAssertion({ id: "assertion-a", subject: entity2.id, predicate: "knows", object: entity3.id }),
  ];

  const relationships = [
    createRelationship({ id: "relationship-b", subject: entity1.id, predicate: "owns", object: entity3.id }),
    createRelationship({ id: "relationship-a", subject: entity2.id, predicate: "owns", object: entity3.id }),
  ];

  it("filters assertions and relationships by canonical dimensions", async () => {
    const query = createQueryTraversalService({
      entities: [entity1, entity2, entity3],
      assertions,
      relationships,
    });

    await expect(query.assertions.findByObject(entityId("entity-c"))).resolves.toEqual([
      assertions[1],
      assertions[0],
    ]);
    await expect(query.relationships.findByPredicate("owns")).resolves.toEqual([
      relationships[1],
      relationships[0],
    ]);
    await expect(query.entities.findByType("repository")).resolves.toEqual([entity3]);
  });

  it("returns empty results without mutation", async () => {
    const query = createQueryTraversalService({ entities: [entity1], assertions: [], relationships: [] });
    await expect(query.assertions.findBySubject(entityId("missing"))).resolves.toEqual([]);
    expect(query.assertions).not.toHaveProperty("save");
  });
});
