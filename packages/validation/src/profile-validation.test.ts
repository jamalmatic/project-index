import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import type { ValidationRule } from "./model";
import { createValidationProfile } from "./profile";
import { validateWithProfile } from "./profile-validation";

const subject = createAssertion({
  id: assertionId("assertion-profile"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

describe("validation profile execution", () => {
  it("executes profile rules in declared order", () => {
    const calls: string[] = [];
    const rule = (id: string, issue = false): ValidationRule<typeof subject> => ({
      id,
      validate: () => {
        calls.push(id);
        return issue
          ? [{ ruleId: "", severity: "warning", message: `${id} warning` }]
          : [];
      },
    });

    const profile = createValidationProfile({
      id: "profile.default",
      name: "Default",
      rules: [rule("rule-a"), rule("rule-b", true), rule("rule-c")],
    });

    const result = validateWithProfile(subject, profile);

    expect(calls).toEqual(["rule-a", "rule-b", "rule-c"]);
    expect(result.subjectId).toBe(subject.id);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([
      { ruleId: "rule-b", severity: "warning", message: "rule-b warning" },
    ]);
  });

  it("preserves validation errors and does not reorder profile rules", () => {
    const first: ValidationRule<typeof subject> = {
      id: "rule-first",
      validate: () => [{ ruleId: "rule-first", severity: "error", message: "first" }],
    };
    const second: ValidationRule<typeof subject> = {
      id: "rule-second",
      validate: () => [{ ruleId: "rule-second", severity: "error", message: "second" }],
    };

    const profile = createValidationProfile({
      id: "profile.strict",
      name: "Strict",
      rules: [first, second],
    });

    const result = validateWithProfile(subject, profile);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual([
      "rule-first",
      "rule-second",
    ]);
  });

  it("does not mutate the profile while executing it", () => {
    const validate = vi.fn(() => []);
    const rule: ValidationRule<typeof subject> = { id: "rule-immutable", validate };
    const profile = createValidationProfile({
      id: "profile.immutable",
      name: "Immutable",
      rules: [rule],
    });

    validateWithProfile(subject, profile);

    expect(validate).toHaveBeenCalledTimes(1);
    expect(profile.ruleIds).toEqual(["rule-immutable"]);
    expect(profile.rules).toHaveLength(1);
  });
});
