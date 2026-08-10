import { deepFreeze } from "@project-index/core";
import type { DetectionRule, DetectionRuleContext, DetectionRuleResult, DetectionRuleId } from "./detection";
import { detectionRuleId } from "./detection";

export type RuleCapability = "detection" | "analysis";

export interface RuleDefinition {
  readonly id: DetectionRuleId;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly capabilities: readonly RuleCapability[];
}

export interface RuleContract extends RuleDefinition {
  execute(context: DetectionRuleContext): Promise<DetectionRuleResult>;
}

export interface RuleInput {
  readonly id: string | DetectionRuleId;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly capabilities?: readonly RuleCapability[];
  readonly execute: (context: DetectionRuleContext) => Promise<DetectionRuleResult>;
}

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const createRuleDefinition = (input: Omit<RuleInput, "execute">): RuleDefinition => {
  const capabilities = [...(input.capabilities ?? ["detection"])];
  if (capabilities.length === 0) throw new Error("Rule must declare at least one capability");
  if (new Set(capabilities).size !== capabilities.length) throw new Error("Rule capabilities must be unique");

  return deepFreeze({
    id: detectionRuleId(input.id),
    version: requiredText(input.version, "Rule version"),
    name: requiredText(input.name, "Rule name"),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    capabilities,
  });
};

export const createRule = (input: RuleInput): RuleContract => {
  const definition = createRuleDefinition(input);
  return deepFreeze({
    ...definition,
    execute: input.execute,
  });
};

export const asDetectionRule = (rule: RuleContract): DetectionRule =>
  deepFreeze({
    id: rule.id,
    version: rule.version,
    detect: rule.execute,
  });
