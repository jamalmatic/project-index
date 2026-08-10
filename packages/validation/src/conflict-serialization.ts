import { deepFreeze } from "@project-index/core";
import type { ValidationConflict } from "./conflict";
import type { ConflictResolution } from "./conflict-resolution";

export interface SerializedValidationConflict {
  readonly id: string;
  readonly subjectId: string;
  readonly kind: ValidationConflict["kind"];
  readonly ruleIds: readonly string[];
  readonly issues: readonly ValidationConflict["issues"][number][];
}

export interface SerializedConflictResolution {
  readonly conflictId: string;
  readonly policyId: string;
  readonly strategy: ConflictResolution["strategy"];
  readonly selectedRuleId?: string;
  readonly resolved: boolean;
}

export interface ConflictDecisionRecord {
  readonly conflict: SerializedValidationConflict;
  readonly resolution: SerializedConflictResolution;
}

export const serializeConflictDecision = (
  conflict: ValidationConflict,
  resolution: ConflictResolution,
): ConflictDecisionRecord => {
  if (conflict.id !== resolution.conflictId) {
    throw new Error("Conflict resolution does not match conflict ID");
  }

  return deepFreeze({
    conflict: {
      id: conflict.id,
      subjectId: conflict.subjectId,
      kind: conflict.kind,
      ruleIds: [...conflict.ruleIds],
      issues: conflict.issues.map((issue) => ({ ...issue })),
    },
    resolution: {
      conflictId: resolution.conflictId,
      policyId: resolution.policyId,
      strategy: resolution.strategy,
      ...(resolution.selectedRuleId !== undefined
        ? { selectedRuleId: resolution.selectedRuleId }
        : {}),
      resolved: resolution.resolved,
    },
  });
};
