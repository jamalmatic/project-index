import { describe, expect, it } from "vitest";
import { assertionId, entityId } from "@project-index/core";
import { evidenceId, sourceId } from "./model";
import {
  createDerivation,
  createProvenanceRecord,
  derivationId,
  provenanceId,
} from "./provenance";

describe("provenance", () => {
  it("creates an immutable assertion provenance record", () => {
    const record = createProvenanceRecord({
      id: "prov:1",
      subject: { role: "assertion", assertionId: assertionId("assertion:1") },
      generatedBy: "  importer:v1  ",
      properties: { nested: { value: true } },
    });

    expect(record.id).toBe(provenanceId("prov:1"));
    expect(record.generatedBy).toBe("importer:v1");
    expect(record.subject.assertionId).toBe("assertion:1");
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.subject)).toBe(true);
    expect(Object.isFrozen(record.properties)).toBe(true);
    expect(Object.isFrozen(record.properties.nested)).toBe(true);
  });

  it.each([
    { role: "source" as const, sourceId: sourceId("source:1") },
    { role: "evidence" as const, evidenceId: evidenceId("evidence:1") },
    { role: "assertion" as const, assertionId: assertionId("assertion:1") },
    { role: "entity" as const, entityId: entityId("entity:1") },
    { role: "activity" as const, activityId: "activity:1" },
  ])("accepts a $role reference", (subject) => {
    expect(() => createProvenanceRecord({ id: `prov:${subject.role}`, subject })).not.toThrow();
  });

  it("requires exactly one reference target", () => {
    expect(() =>
      createProvenanceRecord({ id: "prov:1", subject: { role: "assertion" } }),
    ).toThrow("Provenance reference must identify exactly one target");

    expect(() =>
      createProvenanceRecord({
        id: "prov:1",
        subject: {
          role: "assertion",
          assertionId: assertionId("a1"),
          entityId: entityId("e1"),
        },
      }),
    ).toThrow("Provenance reference must identify exactly one target");
  });

  it("requires the target to match the declared role", () => {
    expect(() =>
      createProvenanceRecord({
        id: "prov:1",
        subject: { role: "evidence", assertionId: assertionId("a1") },
      }),
    ).toThrow("Evidence provenance reference requires evidenceId");
  });
});

describe("derivation", () => {
  it("creates an immutable derivation and normalizes text", () => {
    const derivation = createDerivation({
      id: " derivation:1 ",
      outputAssertionId: "assertion:derived",
      inputAssertionIds: [" assertion:a ", "assertion:b"],
      evidenceIds: [" evidence:1 "],
      ruleId: "  rule:combine-v1  ",
      activityId: "  activity:1 ",
    });

    expect(derivation.id).toBe(derivationId("derivation:1"));
    expect(derivation.ruleId).toBe("rule:combine-v1");
    expect(derivation.outputAssertionId).toBe("assertion:derived");
    expect(derivation.inputAssertionIds).toEqual(["assertion:a", "assertion:b"]);
    expect(derivation.evidenceIds).toEqual(["evidence:1"]);
    expect(Object.isFrozen(derivation)).toBe(true);
    expect(Object.isFrozen(derivation.inputAssertionIds)).toBe(true);
    expect(Object.isFrozen(derivation.evidenceIds)).toBe(true);
  });

  it("requires at least one input assertion", () => {
    expect(() =>
      createDerivation({
        id: "derivation:1",
        outputAssertionId: "assertion:derived",
        inputAssertionIds: [],
        ruleId: "rule:v1",
      }),
    ).toThrow("Derivation must have at least one input assertion");
  });

  it("rejects duplicate input assertions", () => {
    expect(() =>
      createDerivation({
        id: "derivation:1",
        outputAssertionId: "assertion:derived",
        inputAssertionIds: [assertionId("assertion:a"), assertionId("assertion:a")],
        ruleId: "rule:v1",
      }),
    ).toThrow("Derivation input assertions must be unique");
  });

  it("rejects blank provenance and derivation identifiers or rule IDs", () => {
    expect(() => provenanceId("   ")).toThrow("Provenance ID must not be empty");
    expect(() => derivationId("   ")).toThrow("Derivation ID must not be empty");
    expect(() =>
      createDerivation({
        id: "derivation:1",
        outputAssertionId: "assertion:derived",
        inputAssertionIds: ["assertion:a"],
        ruleId: "   ",
      }),
    ).toThrow("Derivation rule ID must not be empty");
  });
});
