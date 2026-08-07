import { describe, expect, it } from "vitest";
import { createValidationIssue, createValidationResult, validateWith, type ValidationRule } from "./model";
import { createEntity } from "@project-index/domain";

describe("validation model", () => {
  it("creates a valid result when there are no errors", () => {
    const result = createValidationResult({ subjectId: "entity:1" });
    expect(result.valid).toBe(true);
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

  it("freezes validation results", () => {
    const result = createValidationResult({ subjectId: "entity:1" });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.issues)).toBe(true);
  });

  it("runs rules and aggregates issues", () => {
    const entity = createEntity({ id: "entity:1", type: "person" });
    const rule: ValidationRule<typeof entity> = {
      id: "test.rule",
      validate: () => [createValidationIssue({ ruleId: "test.rule", severity: "warning", message: "check" })],
    };
    const result = validateWith(entity, [rule]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(1);
  });
});
