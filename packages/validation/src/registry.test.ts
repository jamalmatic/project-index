import { describe, expect, it } from "vitest";
import { createAnalyzer } from "./analyzer";
import { createPlugin } from "./plugin";
import { buildCapabilityIndex, createPluginRegistry, createRegistrationManifest, getAnalyzers } from "./registry";

describe("plugin registration and capability discovery", () => {
  const analyzer = createAnalyzer({
    id: "syntax-analyzer",
    version: "1.0.0",
    name: "Syntax Analyzer",
    capabilities: ["syntax"],
    analyze: async () => ({ observations: [], failures: [] }),
  });

  const plugin = createPlugin({
    id: "syntax-plugin",
    version: "1.0.0",
    name: "Syntax Plugin",
    kind: "analyzer",
    capabilities: ["syntax"],
    implementation: analyzer,
  });

  it("registers plugins by stable identity and rejects duplicates", () => {
    const registry = createPluginRegistry();
    registry.register(plugin);

    expect(registry.get(plugin.id)).toBe(plugin);
    expect(registry.list()).toEqual([plugin]);
    expect(() => registry.register(plugin)).toThrow("already registered");
  });

  it("discovers plugins by kind and capability", () => {
    const registry = createPluginRegistry([plugin]);

    expect(registry.findByKind("analyzer")).toEqual([plugin]);
    expect(registry.findByKind("rule")).toEqual([]);
    expect(registry.findByCapability("syntax")).toEqual([plugin]);
    expect(registry.findByCapability("metadata")).toEqual([]);
  });

  it("builds a deterministic capability index and exposes analyzers", () => {
    const manifest = createRegistrationManifest([plugin]);
    expect(manifest.plugins).toEqual([plugin]);
    expect(buildCapabilityIndex(manifest.plugins)).toEqual({
      capabilities: {
        syntax: [plugin.id],
      },
    });
    expect(getAnalyzers(manifest.plugins)).toEqual([analyzer]);
  });
});
