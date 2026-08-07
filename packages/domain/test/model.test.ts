import { describe, expect, it } from "vitest";
import {
  createAssertion,
  createEntity,
  createRelationship,
  entityType,
  relationshipType,
} from "../src/model";

const expectFrozenDeeply = (value: object) => {
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === "object") {
      expect(Object.isFrozen(child)).toBe(true);
    }
  }
};

describe("domain factories", () => {
  it("create an immutable Entity with canonical identity", () => {
    const entity = createEntity({
      id: "entity:1",
      type: "Package",
      externalIds: { npm: "example" },
      properties: { metadata: { license: "MIT" } },
    });

    expect(entity.id).toBe("entity:1");
    expect(entity.type).toBe("Package");
    expect(entity.identity.canonicalId).toBe(entity.id);
    expect(entity.identity.externalIds.npm).toBe("example");
    expectFrozenDeeply(entity);
    expectFrozenDeeply(entity.properties);
    expectFrozenDeeply(entity.properties.metadata as object);
  });

  it.each([
    ["", "Entity ID"],
    ["   ", "Entity ID"],
  ])("rejects an empty %s", (id, expected) => {
    expect(() => createEntity({ id, type: "Package" })).toThrow(expected);
  });

  it("rejects empty semantic types", () => {
    expect(() => entityType("   ")).toThrow("Entity type");
    expect(() => relationshipType(" ")).toThrow("Relationship type");
  });

  it("rejects invalid temporal intervals", () => {
    expect(() =>
      createEntity({
        id: "entity:1",
        type: "Package",
        temporal: {
          validFrom: "2026-03-01",
          validTo: "2026-02-01",
        },
      }),
    ).toThrow("validFrom must not be later than validTo");
  });

  it("rejects empty external ID namespaces and values", () => {
    expect(() =>
      createEntity({
        id: "entity:1",
        type: "Package",
        externalIds: { "   ": "x" },
      }),
    ).toThrow("External ID namespace");

    expect(() =>
      createEntity({
        id: "entity:1",
        type: "Package",
        externalIds: { npm: "   " },
      }),
    ).toThrow("External ID for npm");
  });

  it("creates immutable Relationships with normalized semantic types", () => {
    const relationship = createRelationship({
      id: "relationship:1",
      subject: "entity:1",
      predicate: " depends_on ",
      object: "entity:2",
      properties: { evidence: { source: "manifest" } },
    });

    expect(relationship.predicate).toBe("depends_on");
    expectFrozenDeeply(relationship);
    expectFrozenDeeply(relationship.properties.evidence as object);
  });

  it("creates immutable Assertions with explicit identity", () => {
    const assertion = createAssertion({
      id: "assertion:1",
      subject: "entity:1",
      predicate: "depends_on",
      object: "entity:2",
    });

    expect(assertion.id).toBe("assertion:1");
    expect(assertion.subject).toBe("entity:1");
    expectFrozenDeeply(assertion);
  });

  it("requires non-empty Relationship and Assertion references", () => {
    expect(() =>
      createRelationship({
        id: "relationship:1",
        subject: "",
        predicate: "depends_on",
        object: "entity:2",
      }),
    ).toThrow("Relationship subject");

    expect(() =>
      createAssertion({
        id: "assertion:1",
        subject: "entity:1",
        predicate: "depends_on",
        object: " ",
      }),
    ).toThrow("Assertion object");
  });
});
