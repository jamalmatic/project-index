import { describe, expect, it } from "vitest";
import {
  assertionId,
  entityId,
  relationshipId,
  createTemporalContext,
} from "@project-index/core";
import { entityType, relationshipType } from "./model";

describe("core domain primitives", () => {
  it("creates branded identifiers without changing their value", () => {
    expect(entityId("entity:1")).toBe("entity:1");
    expect(assertionId("assertion:1")).toBe("assertion:1");
    expect(relationshipId("relationship:1")).toBe("relationship:1");
  });

  it("rejects empty semantic types", () => {
    expect(() => entityType(" ")).toThrow();
    expect(() => relationshipType(" ")).toThrow();
  });

  it("rejects an inverted temporal interval", () => {
    expect(() =>
      createTemporalContext({
        validFrom: "2026-02-01",
        validTo: "2026-01-01",
      }),
    ).toThrow();
  });
});
