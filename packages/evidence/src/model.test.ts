import { describe, expect, it } from "vitest";
import { createEvidence, createSource } from "./model";

describe("source", () => {
  it("creates an immutable source", () => {
    const source = createSource({
      id: "source:example",
      kind: "document",
      title: "Example",
      properties: { nested: { value: 1 } },
    });

    expect(source.id).toBe("source:example");
    expect(Object.isFrozen(source)).toBe(true);
    expect(Object.isFrozen(source.properties)).toBe(true);
    expect(Object.isFrozen(source.properties.nested)).toBe(true);
  });

  it("rejects an empty source id", () => {
    expect(() => createSource({ id: " ", kind: "document" })).toThrow(
      "Source ID must not be empty",
    );
  });

  it("rejects an unsupported source kind at runtime", () => {
    expect(() =>
      createSource({ id: "source:example", kind: "unknown" as never }),
    ).toThrow("Unsupported source kind: unknown");
  });
});

describe("evidence", () => {
  it("requires an assertion or entity reference", () => {
    expect(() => createEvidence({ id: "e1", sourceId: "s1" })).toThrow(
      "Evidence must reference an assertion or entity",
    );
  });

  it("validates locator ranges", () => {
    expect(() =>
      createEvidence({
        id: "e1",
        sourceId: "s1",
        entityId: "entity:1",
        locator: { lineStart: 8, lineEnd: 3 },
      }),
    ).toThrow("Evidence locator lineEnd must not precede lineStart");
  });

  it("creates immutable evidence with an entity reference", () => {
    const evidence = createEvidence({
      id: "e1",
      sourceId: "s1",
      entityId: "entity:1",
      locator: { path: "README.md", lineStart: 4, lineEnd: 8 },
      excerpt: "Example evidence",
    });

    expect(evidence.entityId).toBe("entity:1");
    expect(evidence.excerpt).toBe("Example evidence");
    expect(Object.isFrozen(evidence)).toBe(true);
    expect(Object.isFrozen(evidence.locator)).toBe(true);
    expect(Object.isFrozen(evidence.properties)).toBe(true);
  });
});
