import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult } from "./model";
import { validateAssertionReferences, validateEvidenceReferences, validateRelationshipReferences } from "./referential";
import { validateAssertionConsistency, validateRelationshipConsistency, type ConsistencySnapshot } from "./consistency";
import { validateEvidenceTemporalConsistency } from "./temporal";

export type ValidationSubject = Entity | Assertion | Relationship | Evidence;

export interface ValidationContext {
  readonly unitOfWork: UnitOfWork;
  readonly consistency?: ConsistencySnapshot;
}

const subjectId = (subject: ValidationSubject): string => subject.id;

const structural = (subject: ValidationSubject): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if ("type" in subject && typeof subject.type !== "string") {
    issues.push(createValidationIssue({ ruleId: "structure.type", severity: "error", message: "Type must be a string", path: "type" }));
  }
  return issues;
};

export const validate = async (
  subject: ValidationSubject,
  context: ValidationContext,
): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [...structural(subject)];

  if ("sourceId" in subject) {
    const result = await validateEvidenceReferences(subject, context.unitOfWork);
    issues.push(...result.issues);
    issues.push(...validateEvidenceTemporalConsistency(subject).issues);
  } else if ("predicate" in subject) {
    const referenceResult = await validateAssertionReferences(subject, context.unitOfWork);
    issues.push(...referenceResult.issues);
    if (context.consistency) issues.push(...validateAssertionConsistency(subject, context.consistency).issues);
  }

  if ("subject" in subject && "predicate" in subject && !issues.some((issue) => issue.ruleId.startsWith("assertion."))) {
    if (context.consistency) issues.push(...validateRelationshipConsistency(subject as Relationship, context.consistency).issues);
  }

  return createValidationResult({ subjectId: subjectId(subject), issues });
};

export const validateMany = async (
  subjects: readonly ValidationSubject[],
  context: ValidationContext,
): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];
  for (const subject of subjects) {
    const result = await validate(subject, context);
    issues.push(...result.issues);
  }
  return createValidationResult({ subjectId: "validation:batch", issues });
};
