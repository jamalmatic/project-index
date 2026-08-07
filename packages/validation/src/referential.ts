import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult } from "./model";

const missing = (ruleId: string, message: string, path: string): ValidationIssue =>
  createValidationIssue({ ruleId, severity: "error", message, path });

const validateEntityReferences = async (subject: Assertion | Relationship, unitOfWork: UnitOfWork): Promise<ValidationIssue[]> => {
  const issues: ValidationIssue[] = [];
  if (!(await unitOfWork.entities.getById(subject.subject))) {
    issues.push(missing(`${subject.id}.subject`, `Referenced entity ${subject.subject} does not exist`, "subject"));
  }
  if (!(await unitOfWork.entities.getById(subject.object))) {
    issues.push(missing(`${subject.id}.object`, `Referenced entity ${subject.object} does not exist`, "object"));
  }
  return issues;
};

export const validateAssertionReferences = async (
  assertion: Assertion,
  unitOfWork: UnitOfWork,
): Promise<ValidationResult> =>
  createValidationResult({
    subjectId: assertion.id,
    issues: await validateEntityReferences(assertion, unitOfWork),
  });

export const validateRelationshipReferences = async (
  relationship: Relationship,
  unitOfWork: UnitOfWork,
): Promise<ValidationResult> =>
  createValidationResult({
    subjectId: relationship.id,
    issues: await validateEntityReferences(relationship, unitOfWork),
  });

export const validateEvidenceReferences = async (
  evidence: Evidence,
  unitOfWork: UnitOfWork,
): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];

  if (!(await unitOfWork.evidence.getById(evidence.id))) {
    // The evidence itself is not required to be persisted before validation.
  }
  if (!(await unitOfWork.sources.getById(evidence.sourceId))) {
    issues.push(missing("evidence.reference.source", `Referenced source ${evidence.sourceId} does not exist`, "sourceId"));
  }
  if (evidence.assertionId && !(await unitOfWork.assertions.getById(evidence.assertionId))) {
    issues.push(missing("evidence.reference.assertion", `Referenced assertion ${evidence.assertionId} does not exist`, "assertionId"));
  }
  if (evidence.entityId && !(await unitOfWork.entities.getById(evidence.entityId))) {
    issues.push(missing("evidence.reference.entity", `Referenced entity ${evidence.entityId} does not exist`, "entityId"));
  }

  return createValidationResult({ subjectId: evidence.id, issues });
};

export const validateEntityReferences = async (
  entity: Entity,
  _unitOfWork: UnitOfWork,
): Promise<ValidationResult> => createValidationResult({ subjectId: entity.id });
