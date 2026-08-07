import type { AssertionId, EntityId } from "@project-index/core";
import { assertionId, deepFreeze, entityId } from "@project-index/core";

export type SourceId = string & { readonly __brand: "SourceId" };
export type EvidenceId = string & { readonly __brand: "EvidenceId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const sourceId = (value: string): SourceId => requiredText(value, "Source ID") as SourceId;
export const evidenceId = (value: string): EvidenceId => requiredText(value, "Evidence ID") as EvidenceId;

export type SourceKind = "document" | "repository" | "api" | "database" | "other";

const SOURCE_KINDS: ReadonlySet<SourceKind> = new Set(["document", "repository", "api", "database", "other"]);

export interface Source {
  readonly id: SourceId;
  readonly kind: SourceKind;
  readonly uri?: string;
  readonly title?: string;
  readonly publisher?: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface EvidenceLocator {
  readonly path?: string;
  readonly lineStart?: number;
  readonly lineEnd?: number;
  readonly fragment?: string;
}

export interface Evidence {
  readonly id: EvidenceId;
  readonly sourceId: SourceId;
  readonly assertionId?: AssertionId;
  readonly entityId?: EntityId;
  readonly locator?: EvidenceLocator;
  readonly observedAt?: string;
  readonly capturedAt?: string;
  readonly excerpt?: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface SourceInput {
  readonly id: string | SourceId;
  readonly kind: SourceKind;
  readonly uri?: string;
  readonly title?: string;
  readonly publisher?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createSource = (input: SourceInput): Source => {
  if (!SOURCE_KINDS.has(input.kind)) throw new Error(`Unsupported source kind: ${String(input.kind)}`);

  const source: Source = {
    id: sourceId(input.id),
    kind: input.kind,
    properties: { ...(input.properties ?? {}) },
    ...(input.uri?.trim() ? { uri: input.uri.trim() } : {}),
    ...(input.title?.trim() ? { title: input.title.trim() } : {}),
    ...(input.publisher?.trim() ? { publisher: input.publisher.trim() } : {}),
  };

  return deepFreeze(source);
};

export interface EvidenceInput {
  readonly id: string | EvidenceId;
  readonly sourceId: string | SourceId;
  readonly assertionId?: string | AssertionId;
  readonly entityId?: string | EntityId;
  readonly locator?: EvidenceLocator;
  readonly observedAt?: string;
  readonly capturedAt?: string;
  readonly excerpt?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createEvidence = (input: EvidenceInput): Evidence => {
  if (!input.assertionId && !input.entityId) throw new Error("Evidence must reference an assertion or entity");
  if (input.locator?.lineStart !== undefined && input.locator.lineStart < 1) {
    throw new Error("Evidence locator lineStart must be at least 1");
  }
  if (input.locator?.lineEnd !== undefined && input.locator.lineStart !== undefined && input.locator.lineEnd < input.locator.lineStart) {
    throw new Error("Evidence locator lineEnd must not precede lineStart");
  }

  const evidence: Evidence = {
    id: evidenceId(input.id),
    sourceId: sourceId(input.sourceId),
    properties: { ...(input.properties ?? {}) },
    ...(input.assertionId ? { assertionId: assertionId(input.assertionId) } : {}),
    ...(input.entityId ? { entityId: entityId(input.entityId) } : {}),
    ...(input.locator ? { locator: { ...input.locator } } : {}),
    ...(input.observedAt?.trim() ? { observedAt: input.observedAt.trim() } : {}),
    ...(input.capturedAt?.trim() ? { capturedAt: input.capturedAt.trim() } : {}),
    ...(input.excerpt?.trim() ? { excerpt: input.excerpt.trim() } : {}),
  };

  return deepFreeze(evidence);
};
