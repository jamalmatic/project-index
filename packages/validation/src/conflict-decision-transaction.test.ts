import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationConflict } from "./conflict";
import { createConflictResolutionPolicy } from "./conflict-resolution";
import {
  persistConflictDecisionsInTransaction,
  type TransactionalConflictDecisionRepository,
} from "./conflict-decision-transaction";

const conflict = (id: string, rule: string) => createValidationConflict({
  subjectId: createAssertion({
    id: assertionId(id),
    subject: entityId("entity-1"),
    predicate: "isA",
    object: "person",
  }).id,
  issues: [
    { ruleId: rule, severity: "error", message: rule },
    { ruleId: `${rule}-other`, severity: "warning", message: "other" },
  ],
});

const unitOfWork = (rollback = vi.fn(), commit = vi.fn()): UnitOfWork => ({
  entities: { getById: vi.fn(), save: vi.fn() },
  assertions: { getById: vi.fn(), save: vi.fn() },
  relationships: { getById: vi.fn(), save: vi.fn() },
  sources: { getById: vi.fn(), save: vi.fn() },
  evidence: { getById: vi.fn(), save: vi.fn() },
  derivations: { getById: vi.fn(), save: vi.fn() },
  provenance: { getById: vi.fn(), save: vi.fn() },
  commit,
  rollback,
});

describe("transactional conflict decision persistence", () => {
  it("commits the complete batch once all decisions are saved", async () => {
    const repository: TransactionalConflictDecisionRepository = { save: vi.fn() };
    const commit = vi.fn();
    const rollback = vi.fn();
    const result = await persistConflictDecisionsInTransaction(
      [conflict("assertion-tx-1", "rule-a"), conflict("assertion-tx-2", "rule-b")],
      createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
      repository,
      unitOfWork(rollback, commit),
    );

    expect(result.committed).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
  });

  it("rolls back when any decision fails to persist", async () => {
    const save = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("storage failure"));
    const commit = vi.fn();
    const rollback = vi.fn();

    await expect(
      persistConflictDecisionsInTransaction(
        [conflict("assertion-tx-3", "rule-a"), conflict("assertion-tx-4", "rule-b")],
        createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
        { save },
        unitOfWork(rollback, commit),
      ),
    ).rejects.toThrow("storage failure");

    expect(commit).not.toHaveBeenCalled();
    expect(rollback).toHaveBeenCalledTimes(1);
  });
});
