import type { UnitOfWork } from "@project-index/storage";
import type { ValidationSubject } from "./model";
import type { ValidationProfile } from "./profile";
import type { ConflictResolutionPolicy } from "./conflict-resolution";
import type { ConflictDecisionRecord } from "./conflict-serialization";
import type { ProfileValidationResult } from "./profile-conflict";
import { validateWithProfileAndConflictPolicy } from "./profile-conflict";
import { persistConflictDecisionsInTransaction, type TransactionalConflictDecisionRepository } from "./conflict-decision-transaction";

export interface PersistedProfileValidationResult extends ProfileValidationResult {
  readonly persistedConflictDecisions: readonly ConflictDecisionRecord[];
  readonly committed: boolean;
}

export const validateProfileAndPersistConflictDecisions = async <T extends ValidationSubject>(
  subject: T,
  profile: ValidationProfile<T>,
  policy: ConflictResolutionPolicy,
  repository: TransactionalConflictDecisionRepository,
  unitOfWork: UnitOfWork,
): Promise<PersistedProfileValidationResult> => {
  const result = validateWithProfileAndConflictPolicy(subject, profile, policy);

  if (result.conflicts.length === 0) {
    await unitOfWork.commit();
    return {
      ...result,
      persistedConflictDecisions: [],
      committed: true,
    };
  }

  const persisted = await persistConflictDecisionsInTransaction(
    result.conflicts,
    policy,
    repository,
    unitOfWork,
  );

  return {
    ...result,
    persistedConflictDecisions: persisted.records,
    committed: persisted.committed,
  };
};
