import { describe, expect, it } from "vitest";
import { requireDatabaseUrl } from "./persistence";

describe("persistence application configuration", () => {
  it("requires a non-empty DATABASE_URL", () => {
    expect(() => requireDatabaseUrl(undefined)).toThrow("DATABASE_URL must be configured");
    expect(() => requireDatabaseUrl("   ")).toThrow("DATABASE_URL must be configured");
  });

  it("normalizes configured DATABASE_URL whitespace", () => {
    expect(requireDatabaseUrl("  postgres://example  ")).toBe("postgres://example");
  });

  it("keeps the application persistence contract read-only", async () => {
    const module = await import("./persistence");
    const source = module.createPersistenceService.toString();
    expect(source).toContain("query: storage.createUnifiedQueryService()");
    expect(source).not.toContain("storage,");
  });
});
