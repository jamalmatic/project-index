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
 * This boundary deliberately does not persist anything and does not invent
 * domain objects from observations whose semantics are not yet defined.
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

    // Detection observations become evidence at this boundary. Canonical
    // entities/assertions/relationships require a domain-specific adapter;
    // normalization must not guess those semantics.
    evidence.push({
      id: `evidence:${observation.id}`,
      sourceId: context.sourceId,
      assertionId: undefined,
      properties: {
        discoveryObservationId: observation.id,
        discoveryRuleId: observation.ruleId,
        discoveryRuleVersion: observation.ruleVersion,
        kind: observation.kind,
        value: observation.value,
        ...observation.properties,
      },
    } as EvidenceInput);
  }

  return deepFreeze({ entities, assertions, relationships, evidence });
};
