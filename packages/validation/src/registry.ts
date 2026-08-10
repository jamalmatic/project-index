import { deepFreeze } from "@project-index/core";
import type { AnalyzerContract, AnalyzerCapability } from "./analyzer";
import type { PluginContract, PluginId, PluginKind } from "./plugin";
import type { RuleCapability, RuleContract } from "./rule";

export type RegistryEntry = PluginContract;
export type Capability = RuleCapability | AnalyzerCapability;

export interface PluginRegistry {
  register(plugin: PluginContract): void;
  get(id: PluginId): PluginContract | undefined;
  list(): readonly PluginContract[];
  findByKind(kind: PluginKind): readonly PluginContract[];
  findByCapability(capability: Capability): readonly PluginContract[];
}

export const createPluginRegistry = (initialPlugins: readonly PluginContract[] = []): PluginRegistry => {
  const plugins = new Map<PluginId, PluginContract>();

  const register = (plugin: PluginContract): void => {
    if (plugins.has(plugin.id)) throw new Error(`Plugin ${plugin.id} is already registered`);
    plugins.set(plugin.id, plugin);
  };

  for (const plugin of initialPlugins) register(plugin);

  return {
    register,
    get: (id) => plugins.get(id),
    list: () => deepFreeze([...plugins.values()]),
    findByKind: (kind) => deepFreeze([...plugins.values()].filter((plugin) => plugin.kind === kind)),
    findByCapability: (capability) =>
      deepFreeze([...plugins.values()].filter((plugin) => plugin.capabilities.includes(capability))),
  };
};

export interface RegistrationManifest {
  readonly plugins: readonly PluginContract[];
}

export const createRegistrationManifest = (plugins: readonly PluginContract[]): RegistrationManifest => {
  const ids = plugins.map((plugin) => plugin.id);
  if (new Set(ids).size !== ids.length) throw new Error("Registration manifest plugin IDs must be unique");
  return deepFreeze({ plugins: [...plugins] });
};

export interface CapabilityIndex {
  readonly capabilities: Readonly<Record<string, readonly PluginId[]>>;
}

export const buildCapabilityIndex = (plugins: readonly PluginContract[]): CapabilityIndex => {
  const index: Record<string, PluginId[]> = {};
  for (const plugin of plugins) {
    for (const capability of plugin.capabilities) {
      (index[capability] ??= []).push(plugin.id);
    }
  }
  return deepFreeze({
    capabilities: Object.fromEntries(
      Object.entries(index).map(([capability, ids]) => [capability, [...ids]]),
    ),
  });
};

export const getRules = (plugins: readonly PluginContract[]): readonly RuleContract[] =>
  deepFreeze(
    plugins
      .filter((plugin) => plugin.kind === "rule")
      .map((plugin) => plugin.implementation as RuleContract),
  );

export const getAnalyzers = (plugins: readonly PluginContract[]): readonly AnalyzerContract[] =>
  deepFreeze(
    plugins
      .filter((plugin) => plugin.kind === "analyzer")
      .map((plugin) => plugin.implementation as AnalyzerContract),
  );
