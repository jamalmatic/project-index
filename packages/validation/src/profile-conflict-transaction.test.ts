import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import type { UnitOfWork } from "@project-index/storage";
import type { ValidationRule } from "./model";
import { createValidationProfile } from "./profile";
import { createConflictResolutionPolicy } from "./conflict-resolution";
import { validateProfileAndPersistConflictDecisions } from "./profile-conflict-transaction";

const subject = createAssertion({
  id: assertionId("assertion-profile-transaction"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

const rule = (id: string): ValidationRule<typeof subject> => ({
  id,
  validate: () => [{ ruleId: id, severity: "error", message: id }],
});

const unitOfWork = (): UnitOfWork => ({
  entities: {} as never,
  assertions: {} as never,
  relationships: {} as never,
  sources: {} as never,
  evidence: {} as never,
  derivations: {} as never,
  provenance: {} as never,
  commit: vi.fn(async () => undefined),
  rollback: vi.fn(async () => undefined),
});

describe("profile conflict transaction", () => {
  it("persists profile conflicts and commits once", async () => {
    const uow = unitOfWork();
    const save = vi.fn(async () => undefined);
    const profile = createValidationProfile({
      id: "profile.transaction",
      name: "Transactional",
      rules: [rule("rule-a"), rule("rule-b")],
    });

    const result = await validateProfileAndPersistConflictDecisions(
      subject,
      profile,
      createConflictResolutionPolicy({ id: "policy.first", strategy: "accept-first" }),
      { save },
      uow,
    );

    expect(result.conflicts).toHaveLength(1);
    expect(result.persistedConflictDecisions).toHaveLength(1);
    expect(result.committed).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(uow.commit).toHaveBeenCalledTimes(1);
    expect(uow.rollback).not.toHaveBeenCalled();
  });

  it("rolls back when conflict decision persistence fails", async () => {
    const uow = unitOfWork();
    const error = new Error("persistence failed");
    const profile = createValidationProfile({
      id: "profile.rollback",
      name: "Rollback",
      rules: [rule("rule-a"), rule("rule-b")],
    });

    await expect(
      validateProfileAndPersistConflictDecisions(
        subject,
        profile,
        createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
        { save: vi.fn(async () => { throw error; }) },
        uow,
      ),
    ).rejects.toBe(error);

    expect(uow.rollback).toHaveBeenCalledTimes(1);
    expect(uow.commit).not.toHaveBeenCalled();
  });

  it("commits a profile validation with no conflicts without persistence", async () => {
    const uow = unitOfWork();
    const save = vi.fn(async () => undefined);
    const profile = createValidationProfile({
      id: "profile.clean",
      name: "Clean",
      rules: [{ id: "rule-a", validate: () => [] }],
    });

    const result = await validateProfileAndPersistConflictDecisions(
      subject,
      profile,
      createConflictResolutionPolicy({ id: "policy.reject", strategy: "reject" }),
      { save },
      uow,
    );

    expect(result.conflicts).toEqual([]);
    expect(result.persistedConflictDecisions).toEqual([]);
    expect(result.committed).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(uow.commit).toHaveBeenCalledTimes(1);
  });
});
