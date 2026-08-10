import type { UnitOfWork } from "@project-index/storage";
import type { ValidationConflict } from "./conflict";
import type { ConflictResolutionPolicy } from "./conflict-resolution";
import type { ConflictDecisionRecord } from "./conflict-serialization";
import { serializeConflictDecision } from "./conflict-serialization";
import { resolveValidationConflict } from "./conflict-resolution";

export interface TransactionalConflictDecisionRepository {
  save(record: ConflictDecisionRecord): Promise<void>;
}

export interface PersistedConflictDecisionBatch {
  readonly records: readonly ConflictDecisionRecord[];
  readonly committed: boolean;
}

export const persistConflictDecisionsInTransaction = async (
  conflicts: readonly ValidationConflict[],
  policy: ConflictResolutionPolicy,
  repository: TransactionalConflictDecisionRepository,
  unitOfWork: UnitOfWork,
): Promise<PersistedConflictDecisionBatch> => {
  const records: ConflictDecisionRecord[] = [];

  try {
    for (const conflict of conflicts) {
      const resolution = resolveValidationConflict(conflict, policy);
      const record = serializeConflictDecision(conflict, resolution);
      await repository.save(record);
      records.push(record);
    }

    await unitOfWork.commit();
    return { records, committed: true };
  } catch (error) {
    await unitOfWork.rollback();
    throw error;
  }
};
