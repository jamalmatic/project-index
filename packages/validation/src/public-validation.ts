import type { UnitOfWork } from "@project-index/storage";
import type { ValidationSubject } from "./model";
import type { ValidationProfile } from "./profile";
import type { ConflictResolutionPolicy } from "./conflict-resolution";
import type { ConflictDecisionRepository } from "./conflict-decision-store";
import {
  validateProfileAndPersistConflictDecisions,
  type ProfileConflictTransactionResult,
} from "./profile-conflict-transaction";

export interface PublicValidationOptions<T extends ValidationSubject> {
  readonly profile: ValidationProfile<T>;
  readonly conflictPolicy: ConflictResolutionPolicy;
  readonly conflictDecisions: ConflictDecisionRepository;
}

export const validateAndPersist = async <T extends ValidationSubject>(
  subject: T,
  unitOfWork: UnitOfWork,
  options: PublicValidationOptions<T>,
): Promise<ProfileConflictTransactionResult> =>
  validateProfileAndPersistConflictDecisions(
    subject,
    options.profile,
    options.conflictPolicy,
    options.conflictDecisions,
    unitOfWork,
  );
