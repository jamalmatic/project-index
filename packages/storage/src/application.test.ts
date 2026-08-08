import { describe, expect, it } from "vitest";
import { requireDatabaseUrl } from "./application";

describe("persistence application configuration", () => {
  it("requires a non-empty DATABASE_URL", () => {
    expect(() => requireDatabaseUrl(undefined)).toThrow("DATABASE_URL must be configured");
    expect(() => requireDatabaseUrl("   ")).toThrow("DATABASE_URL must be configured");
  });

  it("normalizes configured DATABASE_URL whitespace", () => {
    expect(requireDatabaseUrl("  postgres://example  ")).toBe("postgres://example");
  });
});
