import { describe, expect, it } from "vitest";
import { assertionId } from "@project-index/core";
import { createAssertion } from "@project-index/domain";
import { executeDerivation } from "./derivation";

describe("derivation execution contract", () => {
  const input = createAssertion({ id: "assertion-1", subject: "entity-1", predicate: "relatedTo", object: "entity-2" });

  it("creates a derived assertion and inspectable derivation lineage", async () => {
    const result = await executeDerivation({
      derivationId: "derivation-1",
      rule: {
        id: "merge-rule",
        version: "1.0.0",
        derive: async () => ({
          assertion: { id: "assertion-2", subject: "entity-1", predicate: "relatedTo", object: "entity-3" },
        }),
      },
      inputAssertions: [input],
      evidenceIds: ["evidence-1" as never],
      activityId: "activity-1",
    });

    expect(result.assertion.id).toBe(assertionId("assertion-2"));
    expect(result.derivation).toMatchObject({
      id: "derivation-1",
      outputAssertionId: "assertion-2",
      inputAssertionIds: ["assertion-1"],
      evidenceIds: ["evidence-1"],
      ruleId: "merge-rule@1.0.0",
      activityId: "activity-1",
    });
  });

  it("rejects an execution without input assertions", async () => {
    await expect(
      executeDerivation({
        derivationId: "derivation-1",
        rule: { id: "rule", version: "1.0.0", derive: async () => ({ assertion: { id: "a", subject: "s", predicate: "p", object: "o" } }) },
        inputAssertions: [],
      }),
    ).rejects.toThrow("at least one input assertion");
  });
});
