import type { ValidationConflict } from "./conflict";
import { deepFreeze } from "@project-index/core";

export type ConflictResolutionStrategy = "reject" | "accept-first" | "accept-last";

export interface ConflictResolutionPolicy {
  readonly id: string;
  readonly strategy: ConflictResolutionStrategy;
}

export interface ConflictResolution {
  readonly conflictId: string;
  readonly policyId: string;
  readonly strategy: ConflictResolutionStrategy;
  readonly selectedRuleId?: string;
  readonly resolved: boolean;
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const createConflictResolutionPolicy = (
  input: ConflictResolutionPolicy,
): ConflictResolutionPolicy =>
  deepFreeze({
    id: requiredText(input.id, "Conflict resolution policy ID"),
    strategy: input.strategy,
  });

export const resolveValidationConflict = (
  conflict: ValidationConflict,
  policy: ConflictResolutionPolicy,
): ConflictResolution => {
  if (!conflict.id) throw new Error("Validation conflict ID must not be empty");

  if (policy.strategy === "reject") {
    return deepFreeze({
      conflictId: conflict.id,
      policyId: policy.id,
      strategy: policy.strategy,
      resolved: false,
    });
  }

  const selectedRuleId =
    policy.strategy === "accept-first" ? conflict.ruleIds[0] : conflict.ruleIds[conflict.ruleIds.length - 1];

  if (!selectedRuleId) throw new Error("Validation conflict has no rule to select");

  return deepFreeze({
    conflictId: conflict.id,
    policyId: policy.id,
    strategy: policy.strategy,
    selectedRuleId,
    resolved: true,
  });
};
