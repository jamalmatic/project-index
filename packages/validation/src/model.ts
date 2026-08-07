import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import { deepFreeze } from "@project-index/core";

export type ValidationSeverity = "error" | "warning";
export type ValidationSubject = Entity | Assertion | Relationship | Evidence;

export interface ValidationIssue {
  readonly ruleId: string;
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly path?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly subjectId: string;
  readonly issues: readonly ValidationIssue[];
}

export interface ValidationRule<T extends ValidationSubject = ValidationSubject> {
  readonly id: string;
  readonly validate: (subject: T) => readonly ValidationIssue[];
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const createValidationIssue = (input: {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
}): ValidationIssue =>
  deepFreeze({
    ruleId: requiredText(input.ruleId, "Validation rule ID"),
    severity: input.severity,
    message: requiredText(input.message, "Validation message"),
    ...(input.path?.trim() ? { path: input.path.trim() } : {}),
  });

export const createValidationResult = (input: {
  subjectId: string;
  issues?: readonly ValidationIssue[];
}): ValidationResult => {
  const issues = [...(input.issues ?? [])];
  return deepFreeze({
    subjectId: requiredText(input.subjectId, "Validation subject ID"),
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  });
};

export const validateWith = <T extends ValidationSubject>(
  subject: T,
  rules: readonly ValidationRule<T>[],
): ValidationResult =>
  createValidationResult({
    subjectId: subject.id,
    issues: rules.flatMap((rule) => rule.validate(subject)),
  });
