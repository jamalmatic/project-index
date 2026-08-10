import { describe, expect, it } from "vitest";
import { createDiscoveryResource } from "./discovery";
import { createAnalyzer, createAnalysisObservation, runAnalyzer } from "./analyzer";

describe("analyzer contract", () => {
  const resource = createDiscoveryResource({ id: "resource-1", uri: "file:///project/a.ts", kind: "file" });

  it("requires stable identity metadata and defaults to metadata capability", () => {
    const analyzer = createAnalyzer({
      id: "typescript-structure",
      version: "1.0.0",
      name: "TypeScript Structure Analyzer",
      analyze: async () => ({ observations: [], failures: [] }),
    });

    expect(analyzer.id).toBe("typescript-structure");
    expect(analyzer.version).toBe("1.0.0");
    expect(analyzer.capabilities).toEqual(["metadata"]);
  });

  it("rejects empty identity metadata and duplicate capabilities", () => {
    expect(() => createAnalyzer({
      id: "",
      version: "1.0.0",
      name: "Analyzer",
      analyze: async () => ({ observations: [], failures: [] }),
    })).toThrow("Analyzer ID must not be empty");

    expect(() => createAnalyzer({
      id: "analyzer",
      version: "",
      name: "Analyzer",
      analyze: async () => ({ observations: [], failures: [] }),
    })).toThrow("Analyzer version must not be empty");

    expect(() => createAnalyzer({
      id: "analyzer",
      version: "1.0.0",
      name: "",
      analyze: async () => ({ observations: [], failures: [] }),
    })).toThrow("Analyzer name must not be empty");

    expect(() => createAnalyzer({
      id: "analyzer",
      version: "1.0.0",
      name: "Analyzer",
      capabilities: ["syntax", "syntax"],
      analyze: async () => ({ observations: [], failures: [] }),
    })).toThrow("Analyzer capabilities must be unique");
  });

  it("returns structured observations and isolates analyzer failures", async () => {
    const observation = createAnalysisObservation({
      analyzerId: "typescript-structure" as never,
      analyzerVersion: "1.0.0",
      kind: "export",
      value: "Thing",
      properties: { exported: true },
    });

    const analyzer = createAnalyzer({
      id: "typescript-structure",
      version: "1.0.0",
      name: "TypeScript Structure Analyzer",
      capabilities: ["syntax", "structure"],
      analyze: async ({ resource: current }) => {
        expect(current.id).toBe(resource.id);
        return { observations: [observation], failures: [] };
      },
    });

    const result = await runAnalyzer(analyzer, { resource, matches: [] });
    expect(result.observations).toHaveLength(1);
    expect(result.failures).toHaveLength(0);

    const failing = createAnalyzer({
      id: "failing-analyzer",
      version: "1.0.0",
      name: "Failing Analyzer",
      analyze: async () => {
        throw new Error("analysis failed");
      },
    });

    await expect(runAnalyzer(failing, { resource, matches: [] })).resolves.toEqual({
      observations: [],
      failures: [{ analyzerId: "failing-analyzer", message: "analysis failed" }],
    });
  });
});
