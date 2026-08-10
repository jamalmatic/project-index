import type { ValidationSubject, ValidationResult } from "./model";
import type { ValidationProfile } from "./profile";
import { detectValidationConflicts, type ValidationConflict } from "./conflict";
import {
  resolveValidationConflict,
  type ConflictResolutionPolicy,
  type ConflictResolution,
} from "./conflict-resolution";
import { validateWithProfile } from "./profile-validation";

export interface ProfileValidationResult {
  readonly validation: ValidationResult;
  readonly conflicts: readonly ValidationConflict[];
  readonly resolutions: readonly ConflictResolution[];
}

export const validateWithProfileAndConflictPolicy = <T extends ValidationSubject>(
  subject: T,
  profile: ValidationProfile<T>,
  policy: ConflictResolutionPolicy,
): ProfileValidationResult => {
  const validation = validateWithProfile(subject, profile);
  const conflicts = detectValidationConflicts(subject, validation.issues);
  const resolutions = conflicts.map((conflict) => resolveValidationConflict(conflict, policy));

  return { validation, conflicts, resolutions };
};
