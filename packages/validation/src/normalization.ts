import { deepFreeze } from "@project-index/core";
import type { AssertionInput, EntityInput, RelationshipInput } from "@project-index/domain";
import type { EvidenceInput } from "@project-index/evidence";
import type { DiscoveryObservation } from "./observation";

export interface DiscoveryNormalizationContext {
  readonly sourceId: string;
}

export interface NormalizedDiscovery {
  readonly entities: readonly EntityInput[];
  readonly assertions: readonly AssertionInput[];
  readonly relationships: readonly RelationshipInput[];
  readonly evidence: readonly EvidenceInput[];
}

/**
 * Converts discovery observations into canonical ingestion inputs.
 *
 * This boundary does not invent domain semantics. A matched observation is
 * converted to evidence only when it explicitly identifies an assertion or
 * entity. Otherwise it remains a discovery-layer observation and requires a
 * domain-specific adapter before ingestion.
 */
export const normalizeDiscovery = (
  observations: readonly DiscoveryObservation[],
  context: DiscoveryNormalizationContext,
): NormalizedDiscovery => {
  const entities: EntityInput[] = [];
  const assertions: AssertionInput[] = [];
  const relationships: RelationshipInput[] = [];
  const evidence: EvidenceInput[] = [];

  for (const observation of observations) {
    if (observation.status !== "matched") continue;

    const properties = observation.properties;
    const assertionId = typeof properties.assertionId === "string" ? properties.assertionId.trim() : "";
    const entityId = typeof properties.entityId === "string" ? properties.entityId.trim() : "";

    if (!assertionId && !entityId) continue;

    evidence.push({
      id: `evidence:${observation.id}`,
      sourceId: context.sourceId,
      ...(assertionId ? { assertionId } : {}),
      ...(entityId ? { entityId } : {}),
      properties: {
        discoveryObservationId: observation.id,
        discoveryRuleId: observation.ruleId,
        discoveryRuleVersion: observation.ruleVersion,
        ...(observation.kind ? { kind: observation.kind } : {}),
        ...(observation.value !== undefined ? { value: observation.value } : {}),
        ...properties,
      },
    });
  }

  return deepFreeze({ entities, assertions, relationships, evidence });
};
