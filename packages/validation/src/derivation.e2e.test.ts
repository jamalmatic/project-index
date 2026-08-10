import { describe, expect, it, vi } from "vitest";
import { createAssertion } from "@project-index/domain";
import { assertionId, entityId } from "@project-index/core";
import { persistDerivation } from "./derivation-persistence";
import type { UnitOfWork } from "@project-index/storage";

const inputAssertion = createAssertion({
  id: assertionId("assertion-input"),
  subject: entityId("entity-1"),
  predicate: "isA",
  object: "person",
});

const unitOfWork = (): UnitOfWork & {
  state: {
    assertions: Map<string, unknown>;
    derivations: Map<string, unknown>;
    provenance: Map<string, unknown>;
  };
} => {
  const state = {
    assertions: new Map<string, unknown>(),
    derivations: new Map<string, unknown>(),
    provenance: new Map<string, unknown>(),
  };
  return {
    state,
    entities: { getById: vi.fn(), save: vi.fn(async () => undefined) },
    assertions: {
      getById: vi.fn(),
      save: vi.fn(async (value: unknown): Promise<void> => {
        state.assertions.set("output", value);
      }),
    },
    relationships: { getById: vi.fn(), save: vi.fn(async () => undefined) },
    sources: { getById: vi.fn(), save: vi.fn(async () => undefined) },
    evidence: { getById: vi.fn(), save: vi.fn(async () => undefined) },
    derivations: {
      getById: vi.fn(),
      save: vi.fn(async (value: unknown): Promise<void> => {
        state.derivations.set("derivation", value);
      }),
    },
    provenance: {
      getById: vi.fn(),
      save: vi.fn(async (value: unknown): Promise<void> => {
        state.provenance.set("provenance", value);
      }),
    },
    commit: vi.fn(async () => undefined),
    rollback: vi.fn(async () => undefined),
  };
};

describe("Phase 2.4 derivation end-to-end", () => {
  it("produces deterministic output lineage", async () => {
    const makeInput = () => {
      const unit = unitOfWork();
      return persistDerivation({
        derivationId: "derivation-1",
        unitOfWork: unit,
        inputAssertions: [inputAssertion],
        rule: {
          id: "rule.person",
          version: "1.0.0",
          async derive({ inputAssertions }) {
            const source = inputAssertions[0];
            if (!source) throw new Error("Missing input assertion");
            return {
              assertion: {
                id: assertionId("assertion-output"),
                subject: source.subject,
                predicate: "isA",
                object: "human",
              },
            };
          },
        },
      });
    };

    const first = await makeInput();
    const second = await makeInput();

    expect(first.assertion).toEqual(second.assertion);
    expect(first.derivation).toEqual(second.derivation);
    expect(first.provenance).toEqual(second.provenance);
  });

  it("commits the complete lineage as one unit", async () => {
    const unit = unitOfWork();
    const result = await persistDerivation({
      derivationId: "derivation-2",
      unitOfWork: unit,
      inputAssertions: [inputAssertion],
      rule: {
        id: "rule.person",
        version: "1.0.0",
        async derive({ inputAssertions }) {
          const source = inputAssertions[0];
          if (!source) throw new Error("Missing input assertion");
          return {
            assertion: {
              id: assertionId("assertion-output-2"),
              subject: source.subject,
              predicate: "isA",
              object: "human",
            },
          };
        },
      },
    });

    expect(unit.commit).toHaveBeenCalledTimes(1);
    expect(unit.rollback).not.toHaveBeenCalled();
    expect(unit.state.assertions.size).toBe(1);
    expect(unit.state.derivations.size).toBe(1);
    expect(unit.state.provenance.size).toBe(1);
    expect(result.provenance.subject).toEqual({ role: "assertion", assertionId: result.assertion.id });
  });

  it("rolls back when lineage persistence fails", async () => {
    const unit = unitOfWork();
    unit.provenance.save.mockRejectedValueOnce(new Error("provenance failure"));

    await expect(
      persistDerivation({
        derivationId: "derivation-3",
        unitOfWork: unit,
        inputAssertions: [inputAssertion],
        rule: {
          id: "rule.person",
          version: "1.0.0",
          async derive({ inputAssertions }) {
            const source = inputAssertions[0];
            if (!source) throw new Error("Missing input assertion");
            return {
              assertion: {
                id: assertionId("assertion-output-3"),
                subject: source.subject,
                predicate: "isA",
                object: "human",
              },
            };
          },
        },
      }),
    ).rejects.toThrow("provenance failure");

    expect(unit.commit).not.toHaveBeenCalled();
    expect(unit.rollback).toHaveBeenCalledTimes(1);
  });
});
