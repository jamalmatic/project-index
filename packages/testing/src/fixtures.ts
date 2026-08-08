import { createAssertion, createEntity, createRelationship, type Assertion, type Entity, type Relationship } from "@project-index/domain";

/** Stable domain fixtures for tests. Keep these deterministic and side-effect free. */
export const fixtureEntity = (id = "entity-fixture-1"): Entity =>
  createEntity({ id, type: "concept" });

export const fixtureAssertion = (id = "assertion-fixture-1"): Assertion =>
  createAssertion({
    id,
    subject: "entity-fixture-1",
    predicate: "fixturePredicate",
    object: "entity-fixture-2",
  });

export const fixtureRelationship = (id = "relationship-fixture-1"): Relationship =>
  createRelationship({
    id,
    subject: "entity-fixture-1",
    predicate: "fixtureRelationship",
    object: "entity-fixture-2",
  });
