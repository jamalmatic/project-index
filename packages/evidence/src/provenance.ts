import type { AssertionId, EntityId } from "@project-index/core";
import { assertionId, deepFreeze, entityId } from "@project-index/core";
import type { EvidenceId, SourceId } from "./model";

export type ProvenanceId = string & { readonly __brand: "ProvenanceId" };
export type DerivationId = string & { readonly __brand: "DerivationId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const provenanceId = (value: string): ProvenanceId => requiredText(value, "Provenance ID") as ProvenanceId;
export const derivationId = (value: string): DerivationId => requiredText(value, "Derivation ID") as DerivationId;

export type ProvenanceRole = "source" | "evidence" | "assertion" | "entity" | "activity";

export interface ProvenanceReference {
  readonly role: ProvenanceRole;
  readonly sourceId?: SourceId;
  readonly evidenceId?: EvidenceId;
  readonly assertionId?: AssertionId;
  readonly entityId?: EntityId;
  readonly activityId?: string;
}

export interface ProvenanceRecord {
  readonly id: ProvenanceId;
  readonly subject: ProvenanceReference;
  readonly generatedBy?: string;
  readonly recordedAt?: string;
  readonly agent?: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface ProvenanceInput {
  readonly id: string | ProvenanceId;
  readonly subject: ProvenanceReference;
  readonly generatedBy?: string;
  readonly recordedAt?: string;
  readonly agent?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

const referenceCount = (reference: ProvenanceReference): number =>
  [reference.sourceId, reference.evidenceId, reference.assertionId, reference.entityId, reference.activityId]
    .filter((value) => value !== undefined).length;

const validateReference = (reference: ProvenanceReference): void => {
  if (referenceCount(reference) !== 1) throw new Error("Provenance reference must identify exactly one target");
  if (reference.role === "source" && !reference.sourceId) throw new Error("Source provenance reference requires sourceId");
  if (reference.role === "evidence" && !reference.evidenceId) throw new Error("Evidence provenance reference requires evidenceId");
  if (reference.role === "assertion" && !reference.assertionId) throw new Error("Assertion provenance reference requires assertionId");
  if (reference.role === "entity" && !reference.entityId) throw new Error("Entity provenance reference requires entityId");
  if (reference.role === "activity" && !reference.activityId) throw new Error("Activity provenance reference requires activityId");
};

export const createProvenanceRecord = (input: ProvenanceInput): ProvenanceRecord => {
  validateReference(input.subject);
  const subject: ProvenanceReference = {
    role: input.subject.role,
    ...(input.subject.sourceId ? { sourceId: input.subject.sourceId } : {}),
    ...(input.subject.evidenceId ? { evidenceId: input.subject.evidenceId } : {}),
    ...(input.subject.assertionId ? { assertionId: assertionId(input.subject.assertionId) } : {}),
    ...(input.subject.entityId ? { entityId: entityId(input.subject.entityId) } : {}),
    ...(input.subject.activityId ? { activityId: input.subject.activityId } : {}),
  };
  const record: ProvenanceRecord = {
    id: provenanceId(input.id),
    subject,
    properties: { ...(input.properties ?? {}) },
    ...(input.generatedBy?.trim() ? { generatedBy: input.generatedBy.trim() } : {}),
    ...(input.recordedAt?.trim() ? { recordedAt: input.recordedAt.trim() } : {}),
    ...(input.agent?.trim() ? { agent: input.agent.trim() } : {}),
  };
  return deepFreeze(record);
};

export interface Derivation {
  readonly id: DerivationId;
  readonly outputAssertionId: AssertionId;
  readonly inputAssertionIds: readonly AssertionId[];
  readonly evidenceIds: readonly EvidenceId[];
  readonly ruleId: string;
  readonly activityId?: string;
  readonly recordedAt?: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface DerivationInput {
  readonly id: string | DerivationId;
  readonly outputAssertionId: string | AssertionId;
  readonly inputAssertionIds: readonly (string | AssertionId)[];
  readonly evidenceIds?: readonly (string | EvidenceId)[];
  readonly ruleId: string;
  readonly activityId?: string;
  readonly recordedAt?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createDerivation = (input: DerivationInput): Derivation => {
  if (input.inputAssertionIds.length === 0) throw new Error("Derivation must have at least one input assertion");
  const ruleId = requiredText(input.ruleId, "Derivation rule ID");
  const inputIds = input.inputAssertionIds.map((id) => assertionId(requiredText(id, "Input assertion ID")));
  if (new Set(inputIds).size !== inputIds.length) throw new Error("Derivation input assertions must be unique");
  const derivation: Derivation = {
    id: derivationId(input.id),
    outputAssertionId: assertionId(requiredText(input.outputAssertionId, "Output assertion ID")),
    inputAssertionIds: inputIds,
    evidenceIds: (input.evidenceIds ?? []).map((id) => requiredText(id, "Evidence ID") as EvidenceId),
    ruleId,
    properties: { ...(input.properties ?? {}) },
    ...(input.activityId?.trim() ? { activityId: input.activityId.trim() } : {}),
    ...(input.recordedAt?.trim() ? { recordedAt: input.recordedAt.trim() } : {}),
  };
  return deepFreeze(derivation);
};
