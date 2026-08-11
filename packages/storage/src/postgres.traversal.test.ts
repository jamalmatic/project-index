import { describe, expect, it, vi } from "vitest";
import { createPostgresStorage } from "./postgres";

const query = vi.fn();

const pool = { query, end: vi.fn() } as never;

vi.mock("pg", () => ({
  Pool: vi.fn(() => pool),
}));

describe("Postgres traversal reads", () => {
  it("pushes entity type filtering into PostgreSQL and preserves ID ordering", async () => {
    query.mockResolvedValueOnce({
      rows: [
        { data: { id: "entity-1", type: "person" } },
        { data: { id: "entity-2", type: "person" } },
      ],
    });

    const storage = createPostgresStorage("postgres://test");
    const result = await storage.createQueryTraversalService().entities.findByType("person");

    expect(query).toHaveBeenCalledWith(
      "SELECT data FROM entities WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["type", "person"],
    );
    expect(result.map((entity) => entity.id)).toEqual(["entity-1", "entity-2"]);
  });

  it("pushes assertion predicate filtering into PostgreSQL", async () => {
    query.mockResolvedValueOnce({
      rows: [{ data: { id: "assertion-1", predicate: "depends_on" } }],
    });

    const storage = createPostgresStorage("postgres://test");
    const result = await storage.createQueryTraversalService().assertions.findByPredicate("depends_on");

    expect(query).toHaveBeenCalledWith(
      "SELECT data FROM assertions WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["predicate", "depends_on"],
    );
    expect(result).toHaveLength(1);
  });
});
