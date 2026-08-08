import { describe, expect, it } from "vitest";
import { createValidationIssue, createValidationResult, validateWith, type ValidationRule } from "./model";
import { createEntity } from "@project-index/domain";

describe("validation model", () => {
  it("normalizes and freezes validation issues", () => {
    const issue = createValidationIssue({
      ruleId: "  test.rule  ",
      severity: "warning",
      message: "  check this  ",
      path: "  entity.name  ",
    });

    expect(issue).toEqual({
      ruleId: "test.rule",
      severity: "warning",
      message: "check this",
      path: "entity.name",
    });
    expect(Object.isFrozen(issue)).toBe(true);
  });

  it("rejects blank issue rule IDs and messages", () => {
    expect(() => createValidationIssue({ ruleId: " ", severity: "error", message: "bad" })).toThrow(
      "Validation rule ID must not be empty",
    );
    expect(() => createValidationIssue({ ruleId: "rule", severity: "error", message: " " })).toThrow(
      "Validation message must not be empty",
    );
  });

  it("creates a valid result when there are no errors", () => {
    const result = createValidationResult({ subjectId: "entity:1" });
    expect(result.valid).toBe(true);
    expect(result.subjectId).toBe("entity:1");
    expect(result.issues).toHaveLength(0);
  });

  it("marks a result invalid when an error exists", () => {
    const result = createValidationResult({
      subjectId: "entity:1",
      issues: [createValidationIssue({ ruleId: "test.rule", severity: "error", message: "bad" })],
    });
    expect(result.valid).toBe(false);
  });

  it("allows warnings without invalidating the result", () => {
    const result = createValidationResult({
      subjectId: "entity:1",
      issues: [createValidationIssue({ ruleId: "test.rule", severity: "warning", message: "check" })],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a blank subject ID", () => {
    expect(() => createValidationResult({ subjectId: "  " })).toThrow(
      "Validation subject ID must not be empty",
    );
  });

  it("deep-freezes results and their issues", () => {
    const result = createValidationResult({
      subjectId: "entity:1",
      issues: [createValidationIssue({ ruleId: "rule", severity: "warning", message: "check" })],
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
    expect(Object.isFrozen(result.issues[0])).toBe(true);
  });

  it("copies the supplied issue collection", () => {
    const issues = [createValidationIssue({ ruleId: "rule", severity: "warning", message: "check" })];
    const result = createValidationResult({ subjectId: "entity:1", issues });

    expect(result.issues).not.toBe(issues);
    expect(result.issues).toEqual(issues);
  });

  it("runs rules in declaration order and aggregates their issues", () => {
    const entity = createEntity({ id: "entity:1", type: "person" });
    const rules: readonly ValidationRule<typeof entity>[] = [
      {
        id: "rule.first",
        validate: () => [createValidationIssue({ ruleId: "rule.first", severity: "warning", message: "first" })],
      },
      {
        id: "rule.second",
        validate: () => [createValidationIssue({ ruleId: "rule.second", severity: "error", message: "second" })],
      },
    ];

    const result = validateWith(entity, rules);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual(["rule.first", "rule.second"]);
  });

  it("rejects a rule with a blank ID", () => {
    const entity = createEntity({ id: "entity:1", type: "person" });
    const rule: ValidationRule<typeof entity> = {
      id: " ",
      validate: () => [],
    };

    expect(() => validateWith(entity, [rule])).toThrow("Validation rule ID must not be empty");
  });
});
