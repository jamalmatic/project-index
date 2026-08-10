import { describe, expect, it } from "vitest";
import {
  createDiscoveryEvidence,
  createDiscoveryResource,
  discover,
  discoveryResourceId,
  type DiscoveryProvider,
} from "./discovery";

describe("discovery primitives", () => {
  it("normalizes and freezes a discovered resource", () => {
    const resource = createDiscoveryResource({
      id: "resource-1",
      uri: "  src/index.ts  ",
      kind: "file",
    });

    expect(resource.id).toBe(discoveryResourceId("resource-1"));
    expect(resource.uri).toBe("src/index.ts");
    expect(Object.isFrozen(resource)).toBe(true);
  });

  it("creates discovery evidence without pretending the resource is a domain entity", () => {
    const evidence = createDiscoveryEvidence({
      id: "discovery-evidence-1",
      resourceId: "resource-1",
      sourceId: "source-1",
      path: "src/index.ts",
      excerpt: "export const value = 1;",
    });

    expect(evidence.resourceId).toBe(discoveryResourceId("resource-1"));
    expect(evidence.sourceId).toBe("source-1");
    expect(evidence.path).toBe("src/index.ts");
    expect(Object.isFrozen(evidence)).toBe(true);
  });

  it("returns discoveries in deterministic URI order", async () => {
    const provider: DiscoveryProvider = {
      discover: async () => [
        createDiscoveryResource({ id: "b", uri: "src/z.ts", kind: "file" }),
        createDiscoveryResource({ id: "a", uri: "src/a.ts", kind: "file" }),
      ],
    };

    const resources = await discover(provider);
    expect(resources.map((resource) => resource.uri)).toEqual(["src/a.ts", "src/z.ts"]);
    expect(Object.isFrozen(resources)).toBe(true);
  });
});
