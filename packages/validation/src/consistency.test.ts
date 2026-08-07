import { describe, expect, it } from "vitest";
import { createAssertion, createRelationship } from "@project-index/domain";
import {
  validateAssertionConsistency,
  validateRelationshipConsistency,
  validateSnapshotConsistency,
} from "./consistency";

describe("consistency validation", () => {
  it("accepts an assertion with no duplicate or conflict", () => {
    const assertion = createAssertion({ id: "assertion:1", subject: "entity:1", predicate: "name", object: "Alice" });
    const result = validateAssertionConsistency(assertion, { assertions: [assertion], relationships: [] });
    expect(result.valid).toBe(true);
  });

  it("detects duplicate assertions", () => {
    const assertion = createAssertion({ id: "assertion:1", subject: "entity:1", predicate: "name", object: "Alice" });
    const duplicate = createAssertion({ id: "assertion:2", subject: "entity:1", predicate: "name", object: "Alice" });
    const result = validateAssertionConsistency(assertion, { assertions: [assertion, duplicate], relationships: [] });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.ruleId).toBe("assertion.duplicate");
  });

  it("detects conflicting assertions for the same subject and predicate", () => {
    const assertion = createAssertion({ id: "assertion:1", subject: "entity:1", predicate: "name", object: "Alice" });
    const conflict = createAssertion({ id: "assertion:2", subject: "entity:1", predicate: "name", object: "Bob" });
    const result = validateAssertionConsistency(assertion, { assertions: [assertion, conflict], relationships: [] });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.ruleId).toBe("assertion.conflict");
  });

  it("rejects self-referential relationships", () => {
    const relationship = createRelationship({ id: "relationship:1", subject: "entity:1", predicate: "knows", object: "entity:1" });
    const result = validateRelationshipConsistency(relationship, { assertions: [], relationships: [relationship] });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.ruleId).toBe("relationship.self-reference");
  });

  it("detects duplicate relationships", () => {
    const relationship = createRelationship({ id: "relationship:1", subject: "entity:1", predicate: "knows", object: "entity:2" });
    const duplicate = createRelationship({ id: "relationship:2", subject: "entity:1", predicate: "knows", object: "entity:2" });
    const result = validateRelationshipConsistency(relationship, { assertions: [], relationships: [relationship, duplicate] });
    expect(result.valid).toBe(false);
    expect(result.issues[0]?.ruleId).toBe("relationship.duplicate");
  });

  it("aggregates consistency issues across a snapshot", () => {
    const assertion = createAssertion({ id: "assertion:1", subject: "entity:1", predicate: "name", object: "Alice" });
    const conflict = createAssertion({ id: "assertion:2", subject: "entity:1", predicate: "name", object: "Bob" });
    const relationship = createRelationship({ id: "relationship:1", subject: "entity:2", predicate: "knows", object: "entity:2" });
    const result = validateSnapshotConsistency({ assertions: [assertion, conflict], relationships: [relationship] });
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
