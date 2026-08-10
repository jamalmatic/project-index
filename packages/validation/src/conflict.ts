import type { ValidationIssue, ValidationSubject } from "./model";
import { deepFreeze } from "@project-index/core";

export type ValidationConflictKind = "error" | "warning";

export interface ValidationConflict {
  readonly id: string;
  readonly subjectId: string;
  readonly kind: ValidationConflictKind;
  readonly ruleIds: readonly string[];
  readonly issues: readonly ValidationIssue[];
}

export interface ValidationConflictInput {
  readonly subjectId: string;
  readonly issues: readonly ValidationIssue[];
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

const kindOf = (issues: readonly ValidationIssue[]): ValidationConflictKind =>
  issues.some((issue) => issue.severity === "error") ? "error" : "warning";

const stableId = (subjectId: string, ruleIds: readonly string[]): string =>
  `validation-conflict:${subjectId}:${ruleIds.join(",")}`;

export const createValidationConflict = (
  input: ValidationConflictInput,
): ValidationConflict => {
  const subjectId = requiredText(input.subjectId, "Validation conflict subject ID");
  const issues = [...input.issues];
  if (issues.length < 2) throw new Error("Validation conflict requires at least two issues");

  const ruleIds = [...new Set(issues.map((issue) => requiredText(issue.ruleId, "Validation rule ID")))].sort();
  if (ruleIds.length < 2) {
    throw new Error("Validation conflict requires issues from at least two rules");
  }

  return deepFreeze({
    id: stableId(subjectId, ruleIds),
    subjectId,
    kind: kindOf(issues),
    ruleIds,
    issues,
  });
};

export const detectValidationConflicts = (
  subject: ValidationSubject,
  issues: readonly ValidationIssue[],
): readonly ValidationConflict[] => {
  const relevant = issues.filter((issue) => issue.severity === "error" || issue.severity === "warning");
  if (relevant.length < 2) return [];

  const ruleIds = new Set(relevant.map((issue) => issue.ruleId));
  if (ruleIds.size < 2) return [];

  return [createValidationConflict({ subjectId: subject.id, issues: relevant })];
};
