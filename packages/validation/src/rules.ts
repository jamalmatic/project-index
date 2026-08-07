import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import { createValidationIssue, type ValidationIssue, type ValidationRule } from "./model";

const issue = (
  ruleId: string,
  message: string,
  path?: string,
): ValidationIssue =>
  createValidationIssue({ ruleId, severity: "error", message, ...(path ? { path } : {}) });

export const entityReferenceRule: ValidationRule<Entity> = {
  id: "entity.reference",
  validate: (entity) =>
    entity.id.trim() ? [] : [issue("entity.reference", "Entity ID must not be empty", "id")],
};

export const assertionReferenceRule: ValidationRule<Assertion> = {
  id: "assertion.reference",
  validate: (assertion) => {
    const issues: ValidationIssue[] = [];
    if (!assertion.subject.trim()) issues.push(issue("assertion.reference", "Assertion subject must not be empty", "subject"));
    if (!assertion.predicate.trim()) issues.push(issue("assertion.reference", "Assertion predicate must not be empty", "predicate"));
    if (!assertion.object.trim()) issues.push(issue("assertion.reference", "Assertion object must not be empty", "object"));
    return issues;
  },
};

export const relationshipReferenceRule: ValidationRule<Relationship> = {
  id: "relationship.reference",
  validate: (relationship) => {
    const issues: ValidationIssue[] = [];
    if (!relationship.subject.trim()) issues.push(issue("relationship.reference", "Relationship subject must not be empty", "subject"));
    if (!relationship.predicate.trim()) issues.push(issue("relationship.reference", "Relationship predicate must not be empty", "predicate"));
    if (!relationship.object.trim()) issues.push(issue("relationship.reference", "Relationship object must not be empty", "object"));
    return issues;
  },
};

export const evidenceReferenceRule: ValidationRule<Evidence> = {
  id: "evidence.reference",
  validate: (evidence) =>
    evidence.assertionId || evidence.entityId
      ? []
      : [issue("evidence.reference", "Evidence must reference an assertion or entity")],
};
