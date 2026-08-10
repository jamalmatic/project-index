import { describe, expect, it } from "vitest";
import { createValidationProfile, composeValidationProfiles } from "./profile";
import type { ValidationRule } from "./model";
import type { Assertion } from "@project-index/domain";

const rule = (id: string): ValidationRule<Assertion> => ({
  id,
  validate: () => [],
});

describe("validation profiles", () => {
  it("creates a named immutable profile with deterministic rule ordering", () => {
    const profile = createValidationProfile({
      id: "default",
      name: "Default",
      rules: [rule("a"), rule("b")],
    });

    expect(profile.id).toBe("default");
    expect(profile.name).toBe("Default");
    expect(profile.ruleIds).toEqual(["a", "b"]);
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it("rejects empty identity metadata and duplicate rules", () => {
    expect(() => createValidationProfile({ id: "", name: "Default", rules: [] })).toThrow(
      "Validation profile ID must not be empty",
    );
    expect(() => createValidationProfile({ id: "default", name: "", rules: [] })).toThrow(
      "Validation profile name must not be empty",
    );
    expect(() =>
      createValidationProfile({ id: "default", name: "Default", rules: [rule("a"), rule("a")] }),
    ).toThrow("Validation profile rules must be unique");
  });

  it("composes profiles without reordering rules", () => {
    const first = createValidationProfile({ id: "first", name: "First", rules: [rule("a")] });
    const second = createValidationProfile({ id: "second", name: "Second", rules: [rule("b")] });
    const composed = composeValidationProfiles("combined", "Combined", [first, second]);

    expect(composed.ruleIds).toEqual(["a", "b"]);
  });
});
