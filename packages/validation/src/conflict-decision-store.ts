import type { ValidationConflict } from "./conflict";
import type { ConflictResolutionPolicy } from "./conflict-resolution";
import type { ConflictDecisionRecord } from "./conflict-serialization";
import { serializeConflictDecision } from "./conflict-serialization";
import { resolveValidationConflict } from "./conflict-resolution";

export interface ConflictDecisionRepository {
  save(record: ConflictDecisionRecord): Promise<void>;
}

export interface PersistedConflictDecision {
  readonly record: ConflictDecisionRecord;
  readonly persisted: boolean;
}

export const persistValidationConflictDecision = async (
  conflict: ValidationConflict,
  policy: ConflictResolutionPolicy,
  repository: ConflictDecisionRepository,
): Promise<PersistedConflictDecision> => {
  const resolution = resolveValidationConflict(conflict, policy);
  const record = serializeConflictDecision(conflict, resolution);
  await repository.save(record);
  return { record, persisted: true };
};

export const persistValidationConflictDecisions = async (
  conflicts: readonly ValidationConflict[],
  policy: ConflictResolutionPolicy,
  repository: ConflictDecisionRepository,
): Promise<readonly PersistedConflictDecision[]> => {
  const results: PersistedConflictDecision[] = [];
  for (const conflict of conflicts) {
    results.push(await persistValidationConflictDecision(conflict, policy, repository));
  }
  return results;
};
