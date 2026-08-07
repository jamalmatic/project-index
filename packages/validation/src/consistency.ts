import type { Assertion, Relationship } from "@project-index/domain";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult } from "./model";

export interface ConsistencySnapshot {
  readonly assertions: readonly Assertion[];
  readonly relationships: readonly Relationship[];
}

const error = (ruleId: string, message: string, path?: string): ValidationIssue =>
  createValidationIssue({ ruleId, severity: "error", message, ...(path ? { path } : {}) });

const tripleKey = (subject: string, predicate: string, object: string): string =>
  `${subject}\u0000${predicate}\u0000${object}`;

const contradictionKey = (subject: string, predicate: string): string =>
  `${subject}\u0000${predicate}`;

export const validateAssertionConsistency = (
  assertion: Assertion,
  snapshot: ConsistencySnapshot,
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const sameTriple = snapshot.assertions.filter(
    (candidate) => candidate.id !== assertion.id && tripleKey(candidate.subject, candidate.predicate, candidate.object) === tripleKey(assertion.subject, assertion.predicate, assertion.object),
  );
  if (sameTriple.length > 0) {
    issues.push(error("assertion.duplicate", `Assertion duplicates ${sameTriple[0].id}`, "id"));
  }

  const conflicting = snapshot.assertions.filter(
    (candidate) => candidate.id !== assertion.id && contradictionKey(candidate.subject, candidate.predicate) === contradictionKey(assertion.subject, assertion.predicate) && candidate.object !== assertion.object,
  );
  if (conflicting.length > 0) {
    issues.push(error("assertion.conflict", `Assertion conflicts with ${conflicting[0].id}`, "object"));
  }

  return createValidationResult({ subjectId: assertion.id, issues });
};

export const validateRelationshipConsistency = (
  relationship: Relationship,
  snapshot: ConsistencySnapshot,
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  if (relationship.subject === relationship.object) {
    issues.push(error("relationship.self-reference", "Relationship subject and object must differ", "object"));
  }

  const duplicate = snapshot.relationships.find(
    (candidate) => candidate.id !== relationship.id && tripleKey(candidate.subject, candidate.predicate, candidate.object) === tripleKey(relationship.subject, relationship.predicate, relationship.object),
  );
  if (duplicate) {
    issues.push(error("relationship.duplicate", `Relationship duplicates ${duplicate.id}`, "id"));
  }

  return createValidationResult({ subjectId: relationship.id, issues });
};

export const validateSnapshotConsistency = (snapshot: ConsistencySnapshot): ValidationResult => {
  const issues: ValidationIssue[] = [];
  for (const assertion of snapshot.assertions) {
    const result = validateAssertionConsistency(assertion, snapshot);
    issues.push(...result.issues);
  }
  for (const relationship of snapshot.relationships) {
    const result = validateRelationshipConsistency(relationship, snapshot);
    issues.push(...result.issues);
  }
  return createValidationResult({
    subjectId: "snapshot:consistency",
    issues,
  });
};
