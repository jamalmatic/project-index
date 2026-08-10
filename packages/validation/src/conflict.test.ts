import { describe, expect, it } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import { createValidationConflict, detectValidationConflicts } from "./conflict";

const subject = createAssertion({
  id: assertionId("assertion-conflict"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

describe("validation conflicts", () => {
  it("creates a deterministic conflict identity from subject and rules", () => {
    const issues = [
      { ruleId: "rule-b", severity: "warning" as const, message: "b" },
      { ruleId: "rule-a", severity: "error" as const, message: "a" },
    ];

    const conflict = createValidationConflict({ subjectId: subject.id, issues });

    expect(conflict.id).toBe(`validation-conflict:${subject.id}:rule-a,rule-b`);
    expect(conflict.kind).toBe("error");
    expect(conflict.ruleIds).toEqual(["rule-a", "rule-b"]);
  });

  it("rejects conflicts that do not represent competing rules", () => {
    expect(() =>
      createValidationConflict({
        subjectId: subject.id,
        issues: [{ ruleId: "rule-a", severity: "error", message: "a" }],
      }),
    ).toThrow("at least two issues");

    expect(() =>
      createValidationConflict({
        subjectId: subject.id,
        issues: [
          { ruleId: "rule-a", severity: "error", message: "a" },
          { ruleId: "rule-a", severity: "warning", message: "b" },
        ],
      }),
    ).toThrow("at least two rules");
  });

  it("detects one deterministic conflict for multiple rules on one subject", () => {
    const conflicts = detectValidationConflicts(subject, [
      { ruleId: "rule-z", severity: "warning", message: "z" },
      { ruleId: "rule-a", severity: "error", message: "a" },
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.ruleIds).toEqual(["rule-a", "rule-z"]);
  });

  it("does not report a conflict for a single rule", () => {
    expect(
      detectValidationConflicts(subject, [
        { ruleId: "rule-a", severity: "error", message: "a" },
      ]),
    ).toEqual([]);
  });
});
