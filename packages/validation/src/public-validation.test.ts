import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import type { UnitOfWork } from "@project-index/storage";
import type { ValidationRule } from "./model";
import { createValidationProfile } from "./profile";
import { createConflictResolutionPolicy } from "./conflict-resolution";
import { validateAndPersist } from "./public-validation";
import type { TransactionalConflictDecisionRepository } from "./conflict-decision-transaction";

const subject = createAssertion({
  id: assertionId("assertion-public"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

const unitOfWork = (): UnitOfWork => ({
  entities: { getById: vi.fn(), save: vi.fn() },
  assertions: { getById: vi.fn(), save: vi.fn() },
  relationships: { getById: vi.fn(), save: vi.fn() },
  sources: { getById: vi.fn(), save: vi.fn() },
  evidence: { getById: vi.fn(), save: vi.fn() },
  derivations: { getById: vi.fn(), save: vi.fn() },
  provenance: { getById: vi.fn(), save: vi.fn() },
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
});

const rule = (id: string): ValidationRule<typeof subject> => ({
  id,
  validate: () => [{ ruleId: id, severity: "error", message: id }],
});

describe("public validation API", () => {
  it("executes and persists the complete workflow through one public entry point", async () => {
    const uow = unitOfWork();
    const repository: TransactionalConflictDecisionRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
    };
    const profile = createValidationProfile({
      id: "profile.public",
      name: "Public",
      rules: [rule("rule-a"), rule("rule-b")],
    });

    const result = await validateAndPersist(subject, uow, {
      profile,
      conflictPolicy: createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
      conflictDecisions: repository,
    });

    expect(result.conflicts).toHaveLength(1);
    expect(result.persistedConflictDecisions).toHaveLength(1);
    expect(result.committed).toBe(true);
    expect(uow.commit).toHaveBeenCalledTimes(1);
  });

  it("keeps clean validation free of conflict persistence", async () => {
    const uow = unitOfWork();
    const repository: TransactionalConflictDecisionRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
    };
    const profile = createValidationProfile({
      id: "profile.clean",
      name: "Clean",
      rules: [{ id: "rule-clean", validate: () => [] }],
    });

    const result = await validateAndPersist(subject, uow, {
      profile,
      conflictPolicy: createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
      conflictDecisions: repository,
    });

    expect(result.conflicts).toEqual([]);
    expect(result.persistedConflictDecisions).toEqual([]);
    expect(repository.saveMany).not.toHaveBeenCalled();
    expect(uow.commit).toHaveBeenCalledTimes(1);
  });

  it("propagates persistence failures through the public boundary", async () => {
    const uow = unitOfWork();
    const error = new Error("persistence failed");
    const repository: TransactionalConflictDecisionRepository = {
      save: vi.fn().mockRejectedValue(error),
      saveMany: vi.fn().mockRejectedValue(error),
    };
    const profile = createValidationProfile({
      id: "profile.failure",
      name: "Failure",
      rules: [rule("rule-a"), rule("rule-b")],
    });

    await expect(
      validateAndPersist(subject, uow, {
        profile,
        conflictPolicy: createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" }),
        conflictDecisions: repository,
      }),
    ).rejects.toBe(error);

    expect(uow.rollback).toHaveBeenCalledTimes(1);
    expect(uow.commit).not.toHaveBeenCalled();
  });
});
