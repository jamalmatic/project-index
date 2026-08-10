import { describe, expect, it } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import { createValidationConflict } from "./conflict";
import { createConflictResolutionPolicy, resolveValidationConflict } from "./conflict-resolution";

const conflict = createValidationConflict({
  subjectId: createAssertion({
    id: assertionId("assertion-resolution"),
    subject: entityId("entity-1"),
    predicate: "isA",
    object: "person",
  }).id,
  issues: [
    { ruleId: "rule-a", severity: "error", message: "a" },
    { ruleId: "rule-b", severity: "error", message: "b" },
  ],
});

describe("conflict resolution policy", () => {
  it("rejects an unresolved conflict explicitly", () => {
    const policy = createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" });
    const result = resolveValidationConflict(conflict, policy);

    expect(result).toEqual({
      conflictId: conflict.id,
      policyId: "policy.reject",
      strategy: "reject",
      resolved: false,
    });
  });

  it("accepts the first deterministic rule", () => {
    const policy = createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" });
    const result = resolveValidationConflict(conflict, policy);

    expect(result.selectedRuleId).toBe("rule-a");
    expect(result.resolved).toBe(true);
  });

  it("accepts the last deterministic rule", () => {
    const policy = createConflictResolutionPolicy({ id: "policy.last", strategy: "accept-last" });
    const result = resolveValidationConflict(conflict, policy);

    expect(result.selectedRuleId).toBe("rule-b");
    expect(result.resolved).toBe(true);
  });

  it("normalizes policy identity", () => {
    const policy = createConflictResolutionPolicy({ id: "  policy.first  ", strategy: "accept-first" });
    expect(policy.id).toBe("policy.first");
  });
});
