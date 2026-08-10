import { describe, expect, it } from "vitest";
import { createDiscoveryResource } from "./discovery";
import { createDetectionMatch, detectionRuleId, type DetectionRule } from "./detection";
import { normalizeDiscovery } from "./normalization";
import { runDiscovery } from "./runner";

describe("discovery to ingestion boundary", () => {
  it("runs detection, preserves rule provenance, and normalizes explicit assertion evidence", async () => {
    const resource = createDiscoveryResource({
      id: "resource-1",
      uri: "file:///repo/package.json",
      kind: "file",
    });

    const rule: DetectionRule = {
      id: detectionRuleId("dependency-rule"),
      version: "1.0.0",
      async detect({ resource: input }) {
        return {
          matches: [
            createDetectionMatch({
              ruleId: detectionRuleId("dependency-rule"),
              resourceId: input.id,
              kind: "dependency",
              value: "@scope/pkg",
              properties: { assertionId: "assertion-1" },
            }),
          ],
          failures: [],
        };
      },
    };

    const discovery = await runDiscovery({ resource, rules: [rule] });
    expect(discovery.observations).toHaveLength(1);
    expect(discovery.observations[0]).toMatchObject({
      status: "matched",
      ruleId: "dependency-rule",
      ruleVersion: "1.0.0",
    });

    const normalized = normalizeDiscovery(discovery.observations, { sourceId: "source-1" });
    expect(normalized.entities).toHaveLength(0);
    expect(normalized.assertions).toHaveLength(0);
    expect(normalized.relationships).toHaveLength(0);
    expect(normalized.evidence).toHaveLength(1);
    expect(normalized.evidence[0]).toMatchObject({
      sourceId: "source-1",
      assertionId: "assertion-1",
    });
  });

  it("does not invent canonical domain objects for an untyped match", async () => {
    const resource = createDiscoveryResource({ id: "resource-2", uri: "file:///repo/README.md", kind: "file" });
    const rule: DetectionRule = {
      id: detectionRuleId("text-rule"),
      version: "1.0.0",
      async detect({ resource: input }) {
        return {
          matches: [createDetectionMatch({ ruleId: detectionRuleId("text-rule"), resourceId: input.id, kind: "text" })],
          failures: [],
        };
      },
    };

    const discovery = await runDiscovery({ resource, rules: [rule] });
    const normalized = normalizeDiscovery(discovery.observations, { sourceId: "source-2" });

    expect(normalized.entities).toHaveLength(0);
    expect(normalized.assertions).toHaveLength(0);
    expect(normalized.relationships).toHaveLength(0);
    expect(normalized.evidence).toHaveLength(0);
  });
});
