import { describe, expect, it } from "vitest";
import { createEvidence } from "./model";

describe("evidence domain contract", () => {
  it("accepts assertion-backed evidence", () => {
    const evidence = createEvidence({
      id: "evidence:assertion:1",
      sourceId: "source:1",
      assertionId: "assertion:1",
    });

    expect(evidence.assertionId).toBe("assertion:1");
    expect(evidence.entityId).toBeUndefined();
  });

  it("accepts entity-backed evidence", () => {
    const evidence = createEvidence({
      id: "evidence:entity:1",
      sourceId: "source:1",
      entityId: "entity:1",
    });

    expect(evidence.entityId).toBe("entity:1");
    expect(evidence.assertionId).toBeUndefined();
  });

  it("accepts evidence supporting both an assertion and an entity", () => {
    const evidence = createEvidence({
      id: "evidence:both:1",
      sourceId: "source:1",
      assertionId: "assertion:1",
      entityId: "entity:1",
    });

    expect(evidence.assertionId).toBe("assertion:1");
    expect(evidence.entityId).toBe("entity:1");
  });

  it("rejects non-positive locator starts", () => {
    expect(() =>
      createEvidence({
        id: "evidence:1",
        sourceId: "source:1",
        entityId: "entity:1",
        locator: { path: "README.md", lineStart: 0 },
      }),
    ).toThrow("Evidence locator lineStart must be at least 1");
  });

  it("rejects reversed locator ranges", () => {
    expect(() =>
      createEvidence({
        id: "evidence:1",
        sourceId: "source:1",
        entityId: "entity:1",
        locator: { path: "README.md", lineStart: 10, lineEnd: 4 },
      }),
    ).toThrow("Evidence locator lineEnd must not precede lineStart");
  });

  it("deep-freezes nested properties", () => {
    const evidence = createEvidence({
      id: "evidence:1",
      sourceId: "source:1",
      entityId: "entity:1",
      properties: { provenance: { confidence: 0.9 } },
    });

    expect(Object.isFrozen(evidence)).toBe(true);
    expect(Object.isFrozen(evidence.properties)).toBe(true);
    expect(Object.isFrozen(evidence.properties.provenance)).toBe(true);
  });
});
