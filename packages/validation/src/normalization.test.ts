import { describe, expect, it } from "vitest";
import { createDiscoveryResource } from "./discovery";
import { createDetectionMatch, detectionRuleId } from "./detection";
import { createDiscoveryObservation } from "./observation";
import { normalizeDiscovery } from "./normalization";

describe("normalizeDiscovery", () => {
  const resource = createDiscoveryResource({ id: "resource-1", uri: "file:///repo", kind: "directory" });

  it("converts only explicitly targeted observations into evidence inputs", () => {
    const observation = createDiscoveryObservation({
      id: "observation-1",
      resourceId: resource.id,
      ruleId: detectionRuleId("rule-1"),
      ruleVersion: "1.0.0",
      status: "matched",
      kind: "assertion-reference",
      value: "assertion-1",
      properties: { assertionId: "assertion-1", signal: "dependency" },
    });

    const result = normalizeDiscovery([observation], { sourceId: "source-1" });

    expect(result.entities).toEqual([]);
    expect(result.assertions).toEqual([]);
    expect(result.relationships).toEqual([]);
    expect(result.evidence).toEqual([
      expect.objectContaining({
        id: "evidence:observation-1",
        sourceId: "source-1",
        assertionId: "assertion-1",
      }),
    ]);
  });

  it("does not invent canonical evidence targets", () => {
    const match = createDetectionMatch({
      ruleId: detectionRuleId("rule-1"),
      resourceId: resource.id,
      kind: "candidate",
      value: "package-a",
    });

    const observation = createDiscoveryObservation({
      id: "observation-2",
      resourceId: match.resourceId,
      ruleId: match.ruleId,
      ruleVersion: "1.0.0",
      status: "matched",
      kind: match.kind,
      value: match.value,
      properties: match.properties,
    });

    expect(normalizeDiscovery([observation], { sourceId: "source-1" }).evidence).toEqual([]);
  });

  it("accepts an entity target without emitting an undefined optional field", () => {
    const observation = createDiscoveryObservation({
      id: "observation-3",
      resourceId: resource.id,
      ruleId: detectionRuleId("rule-1"),
      ruleVersion: "1.0.0",
      status: "matched",
      properties: { entityId: "entity-1" },
    });

    const [evidence] = normalizeDiscovery([observation], { sourceId: "source-1" }).evidence;
    expect(evidence).toMatchObject({ entityId: "entity-1" });
    expect(evidence).not.toHaveProperty("assertionId");
  });
});
