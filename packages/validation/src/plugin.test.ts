import { describe, expect, it } from "vitest";
import { createAnalyzer } from "./analyzer";
import { createPlugin, createPluginDefinition } from "./plugin";

describe("plugin boundary", () => {
  const analyzer = createAnalyzer({
    id: "syntax-analyzer",
    version: "1.0.0",
    name: "Syntax Analyzer",
    capabilities: ["syntax"],
    analyze: async () => ({ observations: [], failures: [] }),
  });

  it("requires stable plugin metadata and capabilities", () => {
    const plugin = createPlugin({
      id: "syntax-plugin",
      version: "1.0.0",
      name: "Syntax Plugin",
      kind: "analyzer",
      capabilities: ["typescript", "syntax"],
      implementation: analyzer,
    });

    expect(plugin.id).toBe("syntax-plugin");
    expect(plugin.kind).toBe("analyzer");
    expect(createPluginDefinition(plugin)).toEqual({
      id: "syntax-plugin",
      version: "1.0.0",
      name: "Syntax Plugin",
      kind: "analyzer",
      capabilities: ["typescript", "syntax"],
    });
  });

  it("rejects invalid identity, capabilities, and kind mismatches", () => {
    expect(() => createPlugin({
      id: "",
      version: "1.0.0",
      name: "Plugin",
      kind: "analyzer",
      capabilities: ["syntax"],
      implementation: analyzer,
    })).toThrow("Plugin ID must not be empty");

    expect(() => createPlugin({
      id: "plugin",
      version: "1.0.0",
      name: "Plugin",
      kind: "analyzer",
      capabilities: ["syntax", "syntax"],
      implementation: analyzer,
    })).toThrow("Plugin capabilities must be unique");

    expect(() => createPlugin({
      id: "plugin",
      version: "1.0.0",
      name: "Plugin",
      kind: "rule",
      capabilities: ["syntax"],
      implementation: analyzer,
    })).toThrow("does not match implementation kind analyzer");
  });
});
