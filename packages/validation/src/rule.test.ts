import { describe, expect, it } from "vitest";
import { createDiscoveryResource } from "./discovery";
import { createDetectionMatch } from "./detection";
import { asDetectionRule, createRule, createRuleDefinition } from "./rule";

describe("rule contract", () => {
  it("requires stable identity metadata and defaults to detection capability", () => {
    const definition = createRuleDefinition({
      id: "package-rule",
      version: "1.0.0",
      name: "Package rule",
    });

    expect(definition).toMatchObject({
      id: "package-rule",
      version: "1.0.0",
      name: "Package rule",
      capabilities: ["detection"],
    });
    expect(Object.isFrozen(definition)).toBe(true);
  });

  it("rejects empty identity metadata and duplicate capabilities", () => {
    expect(() => createRuleDefinition({ id: "", version: "1.0.0", name: "Rule" })).toThrow("Rule ID must not be empty");
    expect(() => createRuleDefinition({ id: "rule", version: "", name: "Rule" })).toThrow("Rule version must not be empty");
    expect(() => createRuleDefinition({ id: "rule", version: "1.0.0", name: "" })).toThrow("Rule name must not be empty");
    expect(() => createRuleDefinition({ id: "rule", version: "1.0.0", name: "Rule", capabilities: ["detection", "detection"] })).toThrow("Rule capabilities must be unique");
  });

  it("adapts the explicit rule contract to the discovery detection contract", async () => {
    const resource = createDiscoveryResource({ id: "resource-1", uri: "file:///repo/package.json", kind: "file" });
    const rule = createRule({
      id: "package-rule",
      version: "1.0.0",
      name: "Package rule",
      execute: async ({ resource: input }) => ({
        matches: [createDetectionMatch({ ruleId: "package-rule" as never, resourceId: input.id, kind: "package" })],
        failures: [],
      }),
    });

    const detectionRule = asDetectionRule(rule);
    const result = await detectionRule.detect({ resource });

    expect(result.matches).toHaveLength(1);
    expect(detectionRule.id).toBe("package-rule");
    expect(detectionRule.version).toBe("1.0.0");
  });
});
