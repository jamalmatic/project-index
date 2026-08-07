import { describe, expect, it } from "vitest";
import { createDerivation, createProvenanceRecord } from "./provenance";

describe("provenance", () => {
  it("creates an immutable assertion provenance record", () => {
    const record = createProvenanceRecord({
      id: "prov:1",
      subject: { role: "assertion", assertionId: "assertion:1" },
      generatedBy: "importer:v1",
      properties: { nested: { value: true } },
    });

    expect(record.subject.assertionId).toBe("assertion:1");
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.subject)).toBe(true);
    expect(Object.isFrozen(record.properties)).toBe(true);
    expect(Object.isFrozen(record.properties.nested)).toBe(true);
  });

  it("requires exactly one reference target", () => {
    expect(() =>
      createProvenanceRecord({
        id: "prov:1",
        subject: { role: "assertion" },
      }),
    ).toThrow("Provenance reference must identify exactly one target");

    expect(() =>
      createProvenanceRecord({
        id: "prov:1",
        subject: {
          role: "assertion",
          assertionId: "a1",
          entityId: "e1",
        },
      }),
    ).toThrow("Provenance reference must identify exactly one target");
  });

  it("requires the target to match the declared role", () => {
    expect(() =>
      createProvenanceRecord({
        id: "prov:1",
        subject: { role: "evidence", assertionId: "a1" },
      }),
    ).toThrow("Evidence provenance reference requires evidenceId");
  });
});

describe("derivation", () => {
  it("creates an immutable derivation", () => {
    const derivation = createDerivation({
      id: "derivation:1",
      outputAssertionId: "assertion:derived",
      inputAssertionIds: ["assertion:a", "assertion:b"],
      evidenceIds: ["evidence:1"],
      ruleId: "rule:combine-v1",
      activityId: "activity:1",
    });

    expect(derivation.outputAssertionId).toBe("assertion:derived");
    expect(derivation.inputAssertionIds).toEqual(["assertion:a", "assertion:b"]);
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
        inputAssertionIds: ["assertion:a", "assertion:a"],
        ruleId: "rule:v1",
      }),
    ).toThrow("Derivation input assertions must be unique");
  });
});
