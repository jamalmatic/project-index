import { describe, expect, it } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import type { ValidationRule } from "./model";
import { createValidationProfile } from "./profile";
import { validateWithProfileAndConflictPolicy } from "./profile-conflict";
import { createConflictResolutionPolicy } from "./conflict-resolution";

const subject = createAssertion({
  id: assertionId("assertion-profile-conflict"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

const rule = (id: string, message: string): ValidationRule<typeof subject> => ({
  id,
  validate: () => [{ ruleId: id, severity: "error", message }],
});

describe("profile-integrated conflict resolution", () => {
  it("detects and rejects conflicts through the selected profile policy", () => {
    const profile = createValidationProfile({
      id: "profile.strict",
      name: "Strict",
      rules: [rule("rule-a", "a"), rule("rule-b", "b")],
    });

    const result = validateWithProfileAndConflictPolicy(
      subject,
      profile,
      createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
    );

    expect(result.validation.valid).toBe(false);
    expect(result.conflicts).toHaveLength(1);
    expect(result.resolutions).toEqual([
      {
        conflictId: result.conflicts[0]?.id,
        policyId: "policy.reject",
        strategy: "reject",
        resolved: false,
      },
    ]);
  });

  it("resolves the conflict deterministically when the profile policy permits it", () => {
    const profile = createValidationProfile({
      id: "profile.first",
      name: "First",
      rules: [rule("rule-a", "a"), rule("rule-b", "b")],
    });

    const result = validateWithProfileAndConflictPolicy(
      subject,
      profile,
      createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" }),
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.resolutions[0]?.selectedRuleId).toBe("rule-a");
    expect(result.resolutions[0]?.resolved).toBe(true);
  });
});
