import { deepFreeze } from "@project-index/core";
import type { DiscoveryResource } from "./discovery";

export type DetectionRuleId = string & { readonly __brand: "DetectionRuleId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const detectionRuleId = (value: string): DetectionRuleId =>
  requiredText(value, "Detection rule ID") as DetectionRuleId;

export interface DetectionRuleContext {
  readonly resource: DiscoveryResource;
}

export interface DetectionMatch {
  readonly ruleId: DetectionRuleId;
  readonly resourceId: DiscoveryResource["id"];
  readonly kind: string;
  readonly value?: unknown;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface DetectionRuleFailure {
  readonly ruleId: DetectionRuleId;
  readonly resourceId: DiscoveryResource["id"];
  readonly message: string;
}

export interface DetectionRuleResult {
  readonly matches: readonly DetectionMatch[];
  readonly failures: readonly DetectionRuleFailure[];
}

export interface DetectionRule {
  readonly id: DetectionRuleId;
  readonly version: string;
  detect(context: DetectionRuleContext): Promise<DetectionRuleResult>;
}

export interface DetectionInput {
  readonly resource: DiscoveryResource;
  readonly rules: readonly DetectionRule[];
}

export const createDetectionMatch = (input: Omit<DetectionMatch, "properties"> & { properties?: Readonly<Record<string, unknown>> }): DetectionMatch =>
  deepFreeze({
    ...input,
    properties: { ...(input.properties ?? {}) },
  });

export const createDetectionFailure = (input: DetectionRuleFailure): DetectionRuleFailure =>
  deepFreeze({
    ruleId: detectionRuleId(input.ruleId),
    resourceId: input.resourceId,
    message: requiredText(input.message, "Detection rule failure message"),
  });

export const runDetectionRule = async (input: DetectionInput, rule: DetectionRule): Promise<DetectionRuleResult> => {
  const result = await rule.detect({ resource: input.resource });
  return deepFreeze({
    matches: [...result.matches],
    failures: [...result.failures],
  });
};

export const runDetection = async (input: DetectionInput): Promise<DetectionRuleResult> => {
  const orderedRules = [...input.rules].sort((left, right) => left.id.localeCompare(right.id));
  const matches: DetectionMatch[] = [];
  const failures: DetectionRuleFailure[] = [];

  for (const rule of orderedRules) {
    try {
      const result = await runDetectionRule(input, rule);
      matches.push(...result.matches);
      failures.push(...result.failures);
    } catch (error) {
      failures.push({
        ruleId: rule.id,
        resourceId: input.resource.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  matches.sort((left, right) => `${left.ruleId}:${left.kind}:${JSON.stringify(left.value ?? null)}`.localeCompare(`${right.ruleId}:${right.kind}:${JSON.stringify(right.value ?? null)}`));
  failures.sort((left, right) => `${left.ruleId}:${left.message}`.localeCompare(`${right.ruleId}:${right.message}`));

  return deepFreeze({ matches, failures });
};
