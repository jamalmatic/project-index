import { deepFreeze } from "@project-index/core";
import type { DetectionMatch, DetectionRuleFailure } from "./detection";
import type { DiscoveryResource } from "./discovery";

export type DiscoveryObservationId = string & { readonly __brand: "DiscoveryObservationId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const discoveryObservationId = (value: string): DiscoveryObservationId =>
  requiredText(value, "Discovery observation ID") as DiscoveryObservationId;

export type DiscoveryObservationStatus = "matched" | "unmatched" | "failed";

export interface DiscoveryObservation {
  readonly id: DiscoveryObservationId;
  readonly resourceId: DiscoveryResource["id"];
  readonly ruleId: DetectionMatch["ruleId"];
  readonly ruleVersion: string;
  readonly status: DiscoveryObservationStatus;
  readonly kind?: string;
  readonly value?: unknown;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly failure?: Pick<DetectionRuleFailure, "message">;
}

export interface DiscoveryObservationInput {
  readonly id: string | DiscoveryObservationId;
  readonly resourceId: DiscoveryResource["id"];
  readonly ruleId: DetectionMatch["ruleId"];
  readonly ruleVersion: string;
  readonly status: DiscoveryObservationStatus;
  readonly kind?: string;
  readonly value?: unknown;
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly failure?: Pick<DetectionRuleFailure, "message">;
}

export const createDiscoveryObservation = (input: DiscoveryObservationInput): DiscoveryObservation => {
  const status = input.status;
  if (status === "failed" && !input.failure?.message) {
    throw new Error("Failed discovery observation requires a failure message");
  }
  if (status !== "failed" && input.failure) {
    throw new Error("Only failed discovery observations may contain a failure");
  }

  return deepFreeze({
    id: discoveryObservationId(input.id),
    resourceId: input.resourceId,
    ruleId: input.ruleId,
    ruleVersion: requiredText(input.ruleVersion, "Detection rule version"),
    status,
    properties: { ...(input.properties ?? {}) },
    ...(input.kind ? { kind: input.kind } : {}),
    ...(input.value !== undefined ? { value: input.value } : {}),
    ...(input.failure ? { failure: { message: requiredText(input.failure.message, "Discovery failure message") } } : {}),
  });
};

export const observationFromMatch = (
  id: string | DiscoveryObservationId,
  match: DetectionMatch,
  ruleVersion: string,
): DiscoveryObservation =>
  createDiscoveryObservation({
    id,
    resourceId: match.resourceId,
    ruleId: match.ruleId,
    ruleVersion,
    status: "matched",
    kind: match.kind,
    value: match.value,
    properties: match.properties,
  });

export const observationFromFailure = (
  id: string | DiscoveryObservationId,
  failure: DetectionRuleFailure,
  ruleVersion: string,
): DiscoveryObservation =>
  createDiscoveryObservation({
    id,
    resourceId: failure.resourceId,
    ruleId: failure.ruleId,
    ruleVersion,
    status: "failed",
    failure: { message: failure.message },
  });

export const sortDiscoveryObservations = (
  observations: readonly DiscoveryObservation[],
): readonly DiscoveryObservation[] =>
  deepFreeze(
    [...observations].sort((left, right) =>
      `${left.resourceId}:${left.ruleId}:${left.id}`.localeCompare(`${right.resourceId}:${right.ruleId}:${right.id}`),
    ),
  );
