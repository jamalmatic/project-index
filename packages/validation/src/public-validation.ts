import type { UnitOfWork } from "@project-index/storage";
import type { ValidationSubject } from "./model";
import type { ValidationProfile } from "./profile";
import type { ConflictResolutionPolicy } from "./conflict-resolution";
import type { TransactionalConflictDecisionRepository } from "./conflict-decision-transaction";
import {
  validateProfileAndPersistConflictDecisions,
  type PersistedProfileValidationResult,
} from "./profile-conflict-transaction";

export interface PublicValidationOptions<T extends ValidationSubject> {
  readonly profile: ValidationProfile<T>;
  readonly conflictPolicy: ConflictResolutionPolicy;
  readonly conflictDecisions: TransactionalConflictDecisionRepository;
}

export const validateAndPersist = async <T extends ValidationSubject>(
  subject: T,
  unitOfWork: UnitOfWork,
  options: PublicValidationOptions<T>,
): Promise<PersistedProfileValidationResult> =>
  validateProfileAndPersistConflictDecisions(
    subject,
    options.profile,
    options.conflictPolicy,
    options.conflictDecisions,
    unitOfWork,
  );
