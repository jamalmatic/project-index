import type { ValidationProfile } from "./profile";
import type { ValidationResult, ValidationSubject } from "./model";
import { validateWith } from "./model";

export const validateWithProfile = <T extends ValidationSubject>(
  subject: T,
  profile: ValidationProfile<T>,
): ValidationResult => validateWith(subject, profile.rules);
