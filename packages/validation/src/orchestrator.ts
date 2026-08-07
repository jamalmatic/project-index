import type { Assertion, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult, type ValidationSubject } from "./model";
import { validateAssertionReferences, validateEvidenceReferences, validateRelationshipReferences } from "./referential";
import { validateAssertionConsistency, validateRelationshipConsistency, type ConsistencySnapshot } from "./consistency";
import { validateEvidenceTemporalConsistency } from "./temporal";

export interface ValidationContext {
  readonly unitOfWork: UnitOfWork;
  readonly consistency?: ConsistencySnapshot;
}

const structural = (subject: ValidationSubject): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if ("type" in subject && typeof subject.type !== "string") {
    issues.push(createValidationIssue({ ruleId: "structure.type", severity: "error", message: "Type must be a string", path: "type" }));
  }
  return issues;
};

export const validateAssertion = async (assertion: Assertion, context: ValidationContext): Promise<ValidationResult> => {
  const issues = structural(assertion);
  issues.push(...(await validateAssertionReferences(assertion, context.unitOfWork)).issues);
  if (context.consistency) issues.push(...validateAssertionConsistency(assertion, context.consistency).issues);
  return createValidationResult({ subjectId: assertion.id, issues });
};

export const validateRelationship = async (relationship: Relationship, context: ValidationContext): Promise<ValidationResult> => {
  const issues = structural(relationship);
  issues.push(...(await validateRelationshipReferences(relationship, context.unitOfWork)).issues);
  if (context.consistency) issues.push(...validateRelationshipConsistency(relationship, context.consistency).issues);
  return createValidationResult({ subjectId: relationship.id, issues });
};

export const validateEvidence = async (evidence: Evidence, context: ValidationContext): Promise<ValidationResult> => {
  const issues = structural(evidence);
  issues.push(...(await validateEvidenceReferences(evidence, context.unitOfWork)).issues);
  issues.push(...validateEvidenceTemporalConsistency(evidence).issues);
  return createValidationResult({ subjectId: evidence.id, issues });
};

export const validate = async (subject: ValidationSubject, context: ValidationContext): Promise<ValidationResult> => {
  if ("sourceId" in subject) return validateEvidence(subject, context);
  if ("identity" in subject) return createValidationResult({ subjectId: subject.id, issues: structural(subject) });
  // Assertion and Relationship have the same runtime shape; their branded IDs
  // are compile-time distinctions. Use the typed entry points for those kinds.
  return createValidationResult({ subjectId: subject.id, issues: structural(subject) });
};

export const validateMany = async (subjects: readonly ValidationSubject[], context: ValidationContext): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];
  for (const subject of subjects) {
    const result = await validate(subject, context);
    issues.push(...result.issues);
  }
  return createValidationResult({ subjectId: "validation:batch", issues });
};
