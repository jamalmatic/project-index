import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import { createValidationConflict } from "./conflict";
import { createConflictResolutionPolicy } from "./conflict-resolution";
import {
  persistValidationConflictDecision,
  persistValidationConflictDecisions,
} from "./conflict-decision-store";

const conflict = createValidationConflict({
  subjectId: createAssertion({
    id: assertionId("assertion-store"),
    subject: entityId("entity-1"),
    predicate: "isA",
    object: "person",
  }).id,
  issues: [
    { ruleId: "rule-a", severity: "error", message: "a" },
    { ruleId: "rule-b", severity: "error", message: "b" },
  ],
});

describe("conflict decision persistence boundary", () => {
  it("serializes and persists one decision through the repository boundary", async () => {
    const save = vi.fn(async () => undefined);
    const result = await persistValidationConflictDecision(
      conflict,
      createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
      { save },
    );

    expect(save).toHaveBeenCalledWith(result.record);
    expect(result.persisted).toBe(true);
    expect(result.record.resolution.resolved).toBe(false);
  });

  it("persists conflicts in deterministic input order", async () => {
    const save = vi.fn(async () => undefined);
    const conflicts = [conflict, { ...conflict, id: `${conflict.id}:second` }];

    const results = await persistValidationConflictDecisions(
      conflicts,
      createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" }),
      { save },
    );

    expect(save).toHaveBeenCalledTimes(2);
    expect(results.map((item) => item.record.conflict.id)).toEqual([
      conflict.id,
      `${conflict.id}:second`,
    ]);
  });

  it("does not report persistence success when repository save fails", async () => {
    const save = vi.fn(async () => {
      throw new Error("storage failure");
    });

    await expect(
      persistValidationConflictDecision(
        conflict,
        createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
        { save },
      ),
    ).rejects.toThrow("storage failure");
  });
});
