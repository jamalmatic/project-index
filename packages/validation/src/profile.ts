import type { ValidationRule, ValidationSubject } from "./model";
import { deepFreeze } from "@project-index/core";

export interface ValidationProfile<T extends ValidationSubject = ValidationSubject> {
  readonly id: string;
  readonly name: string;
  readonly ruleIds: readonly string[];
  readonly rules: readonly ValidationRule<T>[];
}

export interface ValidationProfileInput<T extends ValidationSubject = ValidationSubject> {
  readonly id: string;
  readonly name: string;
  readonly rules: readonly ValidationRule<T>[];
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const createValidationProfile = <T extends ValidationSubject>(
  input: ValidationProfileInput<T>,
): ValidationProfile<T> => {
  const id = requiredText(input.id, "Validation profile ID");
  const name = requiredText(input.name, "Validation profile name");
  const rules = [...input.rules];
  const ruleIds = rules.map((rule) => requiredText(rule.id, "Validation rule ID"));

  if (new Set(ruleIds).size !== ruleIds.length) {
    throw new Error("Validation profile rules must be unique");
  }

  return deepFreeze({ id, name, ruleIds, rules });
};

export const composeValidationProfiles = <T extends ValidationSubject>(
  id: string,
  name: string,
  profiles: readonly ValidationProfile<T>[],
): ValidationProfile<T> => {
  const rules = profiles.flatMap((profile) => profile.rules);
  return createValidationProfile({ id, name, rules });
};
