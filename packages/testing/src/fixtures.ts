import { assertionId, entityId, relationshipId } from "@project-index/core";
import { createAssertion, createEntity, createRelationship, type Assertion, type Entity, type Relationship } from "@project-index/domain";

/** Stable domain fixtures for tests. Keep these deterministic and side-effect free. */
export const fixtureEntity = (id = "entity-fixture-1"): Entity =>
  createEntity({ id: entityId(id), type: "concept", name: "Fixture Entity" });

export const fixtureAssertion = (id = "assertion-fixture-1"): Assertion =>
  createAssertion({
    id: assertionId(id),
    subject: entityId("entity-fixture-1"),
    predicate: "fixturePredicate",
    object: entityId("entity-fixture-2"),
  });

export const fixtureRelationship = (id = "relationship-fixture-1"): Relationship =>
  createRelationship({
    id: relationshipId(id),
    subject: entityId("entity-fixture-1"),
    predicate: "fixtureRelationship",
    object: entityId("entity-fixture-2"),
  });
