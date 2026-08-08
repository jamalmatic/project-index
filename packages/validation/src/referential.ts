import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence } from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult } from "./model";

type StagedReferences = {
  readonly entityIds?: ReadonlySet<string>;
  readonly assertionIds?: ReadonlySet<string>;
  readonly sourceIds?: ReadonlySet<string>;
};

const missing = (ruleId: string, message: string, path: string): ValidationIssue =>
  createValidationIssue({ ruleId, severity: "error", message, path });

const validateEntityReferencesForRelation = async (
  subject: Assertion | Relationship,
  unitOfWork: UnitOfWork,
  staged?: StagedReferences,
): Promise<ValidationIssue[]> => {
  const issues: ValidationIssue[] = [];
  if (!(staged?.entityIds?.has(subject.subject) || (await unitOfWork.entities.getById(subject.subject)))) {
    issues.push(missing(`${subject.id}.subject`, `Referenced entity ${subject.subject} does not exist`, "subject"));
  }
  if (!(staged?.entityIds?.has(subject.object) || (await unitOfWork.entities.getById(subject.object)))) {
    issues.push(missing(`${subject.id}.object`, `Referenced entity ${subject.object} does not exist`, "object"));
  }
  return issues;
};

export const validateAssertionReferences = async (
  assertion: Assertion,
  unitOfWork: UnitOfWork,
  staged?: StagedReferences,
): Promise<ValidationResult> =>
  createValidationResult({
    subjectId: assertion.id,
    issues: await validateEntityReferencesForRelation(assertion, unitOfWork, staged),
  });

export const validateRelationshipReferences = async (
  relationship: Relationship,
  unitOfWork: UnitOfWork,
  staged?: StagedReferences,
): Promise<ValidationResult> =>
  createValidationResult({
    subjectId: relationship.id,
    issues: await validateEntityReferencesForRelation(relationship, unitOfWork, staged),
  });

export const validateEvidenceReferences = async (
  evidence: Evidence,
  unitOfWork: UnitOfWork,
  staged?: StagedReferences,
): Promise<ValidationResult> => {
  const issues: ValidationIssue[] = [];

  if (!(staged?.sourceIds?.has(evidence.sourceId) || (await unitOfWork.sources.getById(evidence.sourceId)))) {
    issues.push(missing("evidence.reference.source", `Referenced source ${evidence.sourceId} does not exist`, "sourceId"));
  }
  if (evidence.assertionId && !(staged?.assertionIds?.has(evidence.assertionId) || (await unitOfWork.assertions.getById(evidence.assertionId)))) {
    issues.push(missing("evidence.reference.assertion", `Referenced assertion ${evidence.assertionId} does not exist`, "assertionId"));
  }
  if (evidence.entityId && !(staged?.entityIds?.has(evidence.entityId) || (await unitOfWork.entities.getById(evidence.entityId)))) {
    issues.push(missing("evidence.reference.entity", `Referenced entity ${evidence.entityId} does not exist`, "entityId"));
  }

  return createValidationResult({ subjectId: evidence.id, issues });
};

export const validateEntityReferences = async (
  entity: Entity,
): Promise<ValidationResult> => createValidationResult({ subjectId: entity.id });
