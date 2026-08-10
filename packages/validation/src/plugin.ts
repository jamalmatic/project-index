import { deepFreeze } from "@project-index/core";
import type { AnalyzerContract } from "./analyzer";
import type { RuleContract } from "./rule";

export type PluginId = string & { readonly __brand: "PluginId" };
export type PluginKind = "rule" | "analyzer";

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const pluginId = (value: string): PluginId =>
  requiredText(value, "Plugin ID") as PluginId;

export interface PluginDefinition {
  readonly id: PluginId;
  readonly version: string;
  readonly name: string;
  readonly kind: PluginKind;
  readonly capabilities: readonly string[];
}

export type PluginImplementation = RuleContract | AnalyzerContract;

export interface PluginContract extends PluginDefinition {
  readonly implementation: PluginImplementation;
}

export interface PluginInput {
  readonly id: string | PluginId;
  readonly version: string;
  readonly name: string;
  readonly kind: PluginKind;
  readonly capabilities?: readonly string[];
  readonly implementation: PluginImplementation;
}

export const createPlugin = (input: PluginInput): PluginContract => {
  const id = pluginId(input.id);
  const version = requiredText(input.version, "Plugin version");
  const name = requiredText(input.name, "Plugin name");
  const capabilities = [...(input.capabilities ?? [])];

  if (capabilities.length === 0) throw new Error("Plugin must declare at least one capability");
  if (new Set(capabilities).size !== capabilities.length) throw new Error("Plugin capabilities must be unique");

  const implementationKind = "analyze" in input.implementation ? "analyzer" : "rule";
  const expectedKind: PluginKind = implementationKind === "analyzer" ? "analyzer" : "rule";
  if (input.kind !== expectedKind) {
    throw new Error(`Plugin kind ${input.kind} does not match implementation kind ${expectedKind}`);
  }

  return deepFreeze({ id, version, name, kind: input.kind, capabilities, implementation: input.implementation });
};

export const createPluginDefinition = (plugin: PluginContract): PluginDefinition =>
  deepFreeze({
    id: plugin.id,
    version: plugin.version,
    name: plugin.name,
    kind: plugin.kind,
    capabilities: [...plugin.capabilities],
  });
