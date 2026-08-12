import { describe, expect, it, vi } from "vitest";
import { createPostgresStorage } from "./postgres";

const query = vi.fn();
const pool = { query, end: vi.fn() } as never;

vi.mock("pg", () => ({
  Pool: vi.fn(() => pool),
}));

describe("Phase 2.8.12 Postgres unified query", () => {
  it("combines live identity and traversal reads into the unified read-only boundary", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ data: { id: "entity-1", type: "person" } }] })
      .mockResolvedValueOnce({ rows: [{ data: { id: "entity-2", type: "person" } }] });

    const storage = createPostgresStorage("postgres://test");
    const unified = storage.createUnifiedQueryService();

    await expect(unified.entities.getById("entity-1" as never)).resolves.toEqual({
      id: "entity-1",
      type: "person",
    });
    await expect(unified.entities.findByType("person")).resolves.toEqual([
      { id: "entity-2", type: "person" },
    ]);

    expect(query).toHaveBeenNthCalledWith(1, "SELECT data FROM entities WHERE id = $1", ["entity-1"]);
    expect(query).toHaveBeenNthCalledWith(
      2,
      "SELECT data FROM entities WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["type", "person"],
    );
  });

  it("keeps the unified Postgres query surface free of persistence mutation and transaction APIs", () => {
    const storage = createPostgresStorage("postgres://test");
    const unified = storage.createUnifiedQueryService();

    expect(unified).not.toHaveProperty("pool");
    expect(unified).not.toHaveProperty("createUnitOfWork");
    expect(unified).not.toHaveProperty("commit");
    expect(unified).not.toHaveProperty("rollback");
    expect(unified.entities).not.toHaveProperty("save");
    expect(unified.assertions).not.toHaveProperty("save");
    expect(unified.relationships).not.toHaveProperty("save");
    expect(unified.sources).not.toHaveProperty("save");
    expect(unified.evidence).not.toHaveProperty("save");
    expect(unified.derivations).not.toHaveProperty("save");
    expect(unified.provenance).not.toHaveProperty("save");
  });
});
