import { describe, expect, it } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import { createValidationConflict } from "./conflict";
import { createConflictResolutionPolicy, resolveValidationConflict } from "./conflict-resolution";
import { serializeConflictDecision } from "./conflict-serialization";

const conflict = createValidationConflict({
  subjectId: createAssertion({
    id: assertionId("assertion-serialization"),
    subject: entityId("entity-1"),
    predicate: "isA",
    object: "person",
  }).id,
  issues: [
    { ruleId: "rule-b", severity: "warning", message: "b" },
    { ruleId: "rule-a", severity: "error", message: "a" },
  ],
});

describe("conflict decision serialization", () => {
  it("serializes the complete conflict decision deterministically", () => {
    const resolution = resolveValidationConflict(
      conflict,
      createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" }),
    );

    const record = serializeConflictDecision(conflict, resolution);

    expect(record).toEqual({
      conflict: {
        id: conflict.id,
        subjectId: conflict.subjectId,
        kind: "error",
        ruleIds: ["rule-a", "rule-b"],
        issues: [
          { ruleId: "rule-b", severity: "warning", message: "b" },
          { ruleId: "rule-a", severity: "error", message: "a" },
        ],
      },
      resolution: {
        conflictId: conflict.id,
        policyId: "policy.first",
        strategy: "accept-first",
        selectedRuleId: "rule-a",
        resolved: true,
      },
    });
  });

  it("rejects a resolution belonging to another conflict", () => {
    const resolution = resolveValidationConflict(
      conflict,
      createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
    );

    expect(() =>
      serializeConflictDecision(
        { ...conflict, id: "other-conflict" },
        resolution,
      ),
    ).toThrow("does not match conflict ID");
  });
});
