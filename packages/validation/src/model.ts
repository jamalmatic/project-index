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

const validateSeverity = (severity: ValidationSeverity): ValidationSeverity => {
  if (severity !== "error" && severity !== "warning") {
    throw new Error(`Unsupported validation severity: ${String(severity)}`);
  }
  return severity;
};

export const createValidationIssue = (input: {
  ruleId: string;
  severity: ValidationSeverity;
  message: string;
  path?: string;
}): ValidationIssue =>
  deepFreeze({
    ruleId: requiredText(input.ruleId, "Validation rule ID"),
    severity: validateSeverity(input.severity),
    message: requiredText(input.message, "Validation message"),
    ...(input.path?.trim() ? { path: input.path.trim() } : {}),
  });

export const createValidationResult = (input: {
  subjectId: string;
  issues?: readonly ValidationIssue[];
}): ValidationResult => {
  const subjectId = requiredText(input.subjectId, "Validation subject ID");
  const issues = [...(input.issues ?? [])].map((issue) =>
    createValidationIssue(issue),
  );

  return deepFreeze({
    subjectId,
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  });
};

export const validateWith = <T extends ValidationSubject>(
  subject: T,
  rules: readonly ValidationRule<T>[],
): ValidationResult => {
  const issues = rules.flatMap((rule) => {
    const ruleId = requiredText(rule.id, "Validation rule ID");
    const produced = rule.validate(subject);
    return produced.map((issue) =>
      createValidationIssue({
        ...issue,
        ruleId: issue.ruleId || ruleId,
      }),
    );
  });

  return createValidationResult({
    subjectId: subject.id,
    issues,
  });
};
