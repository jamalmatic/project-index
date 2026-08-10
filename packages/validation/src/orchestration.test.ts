import { describe, expect, it } from "vitest";
import { createAnalyzer } from "./analyzer";
import { createDiscoveryResource } from "./discovery";
import { createPlugin } from "./plugin";
import { createPluginRegistry } from "./registry";
import { runAnalysis, runAnalysisBatch, runAnalysisWithRegistry, selectAnalyzers } from "./orchestration";

describe("deterministic analyzer orchestration", () => {
  const resource = createDiscoveryResource({ id: "resource-1", uri: "file:///project/a.ts", kind: "file" });

  const alpha = createAnalyzer({
    id: "alpha",
    version: "1.0.0",
    name: "Alpha",
    capabilities: ["syntax"],
    analyze: async () => ({
      observations: [{ analyzerId: "alpha" as never, analyzerVersion: "1.0.0", kind: "zeta", value: 1, properties: {} }],
      failures: [],
    }),
  });

  const beta = createAnalyzer({
    id: "beta",
    version: "1.0.0",
    name: "Beta",
    capabilities: ["structure"],
    analyze: async () => ({
      observations: [{ analyzerId: "beta" as never, analyzerVersion: "1.0.0", kind: "alpha", value: 2, properties: {} }],
      failures: [],
    }),
  });

  it("executes analyzers independently and returns deterministic ordering", async () => {
    const result = await runAnalysis({ resource, matches: [], analyzers: [beta, alpha] });
    expect(result.observations.map((observation) => observation.analyzerId)).toEqual(["alpha", "beta"]);
    expect(result.failures).toEqual([]);
  });

  it("selects registered analyzers by capability", () => {
    const registry = createPluginRegistry([
      createPlugin({ id: "beta-plugin", version: "1.0.0", name: "Beta", kind: "analyzer", capabilities: ["structure"], implementation: beta }),
      createPlugin({ id: "alpha-plugin", version: "1.0.0", name: "Alpha", kind: "analyzer", capabilities: ["syntax"], implementation: alpha }),
    ]);

    expect(selectAnalyzers(registry, ["syntax"])).toEqual([alpha]);
  });

  it("orchestrates through the registry and sorts batches by resource URI", async () => {
    const registry = createPluginRegistry([
      createPlugin({ id: "beta-plugin", version: "1.0.0", name: "Beta", kind: "analyzer", capabilities: ["structure"], implementation: beta }),
      createPlugin({ id: "alpha-plugin", version: "1.0.0", name: "Alpha", kind: "analyzer", capabilities: ["syntax"], implementation: alpha }),
    ]);

    const result = await runAnalysisWithRegistry({ resource, matches: [], registry });
    expect(result.observations.map((observation) => observation.analyzerId)).toEqual(["alpha", "beta"]);

    const batch = await runAnalysisBatch([
      { resource: { ...resource, uri: "file:///z.ts" }, matches: [], analyzers: [alpha] },
      { resource: { ...resource, uri: "file:///a.ts" }, matches: [], analyzers: [alpha] },
    ]);
    expect(batch.map((entry) => entry.resource.uri)).toEqual(["file:///a.ts", "file:///z.ts"]);
  });
});
