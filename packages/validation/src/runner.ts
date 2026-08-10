import { deepFreeze } from "@project-index/core";
import type { DetectionRule, DetectionRuleFailure, DetectionMatch } from "./detection";
import { runDetection } from "./detection";
import type { DiscoveryResource } from "./discovery";
import { discoveryObservationId, observationFromFailure, observationFromMatch, sortDiscoveryObservations, type DiscoveryObservation } from "./observation";

export interface DiscoveryRunInput {
  readonly resource: DiscoveryResource;
  readonly rules: readonly DetectionRule[];
}

export interface DiscoveryRunResult {
  readonly resource: DiscoveryResource;
  readonly observations: readonly DiscoveryObservation[];
}

const matchId = (resource: DiscoveryResource, match: DetectionMatch, index: number): string =>
  `discovery:${resource.id}:${match.ruleId}:${index}`;

const failureId = (resource: DiscoveryResource, failure: DetectionRuleFailure, index: number): string =>
  `discovery:${resource.id}:${failure.ruleId}:failure:${index}`;

export const runDiscovery = async (input: DiscoveryRunInput): Promise<DiscoveryRunResult> => {
  const result = await runDetection(input);
  const observations: DiscoveryObservation[] = [];

  result.matches.forEach((match, index) => {
    observations.push(observationFromMatch(matchId(input.resource, match, index), match, input.rules.find((rule) => rule.id === match.ruleId)?.version ?? "unknown"));
  });

  result.failures.forEach((failure, index) => {
    observations.push(observationFromFailure(failureId(input.resource, failure, index), failure, input.rules.find((rule) => rule.id === failure.ruleId)?.version ?? "unknown"));
  });

  return deepFreeze({
    resource: input.resource,
    observations: sortDiscoveryObservations(observations),
  });
};

export const runDiscoveryBatch = async (
  inputs: readonly DiscoveryRunInput[],
): Promise<readonly DiscoveryRunResult[]> => {
  const results = await Promise.all(inputs.map(runDiscovery));
  return deepFreeze(
    [...results].sort((left, right) => left.resource.uri.localeCompare(right.resource.uri)),
  );
};

export { discoveryObservationId };
