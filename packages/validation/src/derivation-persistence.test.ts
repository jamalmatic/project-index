import { describe, expect, it, vi } from "vitest";
import { assertionId } from "@project-index/core";
import { createAssertion, type Assertion } from "@project-index/domain";
import type { UnitOfWork } from "@project-index/storage";
import { persistDerivation } from "./derivation-persistence";

const inputAssertion = (): Assertion =>
  createAssertion({
    id: assertionId("assertion-input"),
    subject: "entity-1",
    predicate: "has-name",
    object: "Alice",
  });

const makeUnitOfWork = (): UnitOfWork => ({
  entities: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  assertions: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  relationships: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  sources: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  evidence: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  derivations: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  provenance: { getById: vi.fn(), save: vi.fn().mockResolvedValue(undefined) },
  commit: vi.fn().mockResolvedValue(undefined),
  rollback: vi.fn().mockResolvedValue(undefined),
});

const input = (unitOfWork: UnitOfWork) => ({
  unitOfWork,
  derivationId: "derivation-1",
  provenanceId: "provenance-1",
  inputAssertions: [inputAssertion()],
  rule: {
    id: "rule.example",
    version: "1.0.0",
    derive: vi.fn().mockResolvedValue({
      assertion: {
        id: "assertion-derived",
        subject: "entity-1",
        predicate: "has-derived-name",
        object: "Alice",
      },
    }),
  },
});

describe("persistDerivation", () => {
  it("persists assertion, derivation, and provenance before one commit", async () => {
    const unitOfWork = makeUnitOfWork();
    const result = await persistDerivation(input(unitOfWork));

    expect(unitOfWork.assertions.save).toHaveBeenCalledWith(result.assertion);
    expect(unitOfWork.derivations.save).toHaveBeenCalledWith(result.derivation);
    expect(unitOfWork.provenance.save).toHaveBeenCalledWith(result.provenance);
    expect(unitOfWork.commit).toHaveBeenCalledOnce();
    expect(unitOfWork.rollback).not.toHaveBeenCalled();
    expect(result.provenance.subject).toEqual({ role: "assertion", assertionId: result.assertion.id });
  });

  it("rolls back when lineage persistence fails", async () => {
    const unitOfWork = makeUnitOfWork();
    vi.mocked(unitOfWork.provenance.save).mockRejectedValueOnce(new Error("provenance write failed"));

    await expect(persistDerivation(input(unitOfWork))).rejects.toThrow("provenance write failed");
    expect(unitOfWork.commit).not.toHaveBeenCalled();
    expect(unitOfWork.rollback).toHaveBeenCalledOnce();
  });

  it("rolls back when commit fails", async () => {
    const unitOfWork = makeUnitOfWork();
    vi.mocked(unitOfWork.commit).mockRejectedValueOnce(new Error("commit failed"));

    await expect(persistDerivation(input(unitOfWork))).rejects.toThrow("commit failed");
    expect(unitOfWork.rollback).toHaveBeenCalledOnce();
  });
});
