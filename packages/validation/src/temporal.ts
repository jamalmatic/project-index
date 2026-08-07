import type { Derivation, ProvenanceRecord } from "@project-index/evidence";
import type { Evidence } from "@project-index/evidence";
import { createValidationIssue, createValidationResult, type ValidationIssue, type ValidationResult } from "./model";

const temporalError = (ruleId: string, message: string, path: string): ValidationIssue =>
  createValidationIssue({ ruleId, severity: "error", message, path });

const parseTimestamp = (value: string, path: string, issues: ValidationIssue[], ruleId: string): Date | undefined => {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    issues.push(temporalError(ruleId, `Invalid timestamp: ${value}`, path));
    return undefined;
  }
  return timestamp;
};

export const validateEvidenceTemporalConsistency = (evidence: Evidence): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const observed = evidence.observedAt
    ? parseTimestamp(evidence.observedAt, "observedAt", issues, "evidence.timestamp.observedAt")
    : undefined;
  const captured = evidence.capturedAt
    ? parseTimestamp(evidence.capturedAt, "capturedAt", issues, "evidence.timestamp.capturedAt")
    : undefined;

  if (observed && captured && captured.getTime() < observed.getTime()) {
    issues.push(
      temporalError(
        "evidence.temporal.order",
        "Evidence capturedAt must not precede observedAt",
        "capturedAt",
      ),
    );
  }

  return createValidationResult({ subjectId: evidence.id, issues });
};

export const validateProvenanceTemporalConsistency = (record: ProvenanceRecord): ValidationResult => {
  const issues: ValidationIssue[] = [];
  if (record.recordedAt) {
    parseTimestamp(record.recordedAt, "recordedAt", issues, "provenance.timestamp.recordedAt");
  }
  return createValidationResult({ subjectId: record.id, issues });
};

export const validateDerivationTemporalConsistency = (
  derivation: Derivation,
  inputRecordedAt: readonly string[],
  evidenceRecordedAt: readonly string[],
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const recordedAt = derivation.recordedAt
    ? parseTimestamp(derivation.recordedAt, "recordedAt", issues, "derivation.timestamp.recordedAt")
    : undefined;

  const dependencyTimes = [...inputRecordedAt, ...evidenceRecordedAt].map((value) =>
    parseTimestamp(value, "dependencies", issues, "derivation.timestamp.dependency"),
  ).filter((value): value is Date => value !== undefined);

  if (recordedAt) {
    const latestDependency = dependencyTimes.reduce<Date | undefined>(
      (latest, current) => (!latest || current.getTime() > latest.getTime() ? current : latest),
      undefined,
    );
    if (latestDependency && recordedAt.getTime() < latestDependency.getTime()) {
      issues.push(
        temporalError(
          "derivation.temporal.order",
          "Derivation recordedAt must not precede its recorded inputs or evidence",
          "recordedAt",
        ),
      );
    }
  }

  return createValidationResult({ subjectId: derivation.id, issues });
};
