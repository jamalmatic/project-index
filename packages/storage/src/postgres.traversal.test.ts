import { describe, expect, it, vi } from "vitest";
import { createPostgresStorage } from "./postgres";

const query = vi.fn();

const pool = { query, end: vi.fn() } as never;

vi.mock("pg", () => ({
  Pool: vi.fn(() => pool),
}));

describe("Phase 2.8.11 live Postgres traversal reads", () => {
  it("pushes entity type filtering into PostgreSQL and preserves ID ordering", async () => {
    query.mockReset();
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

  it("pushes assertion and relationship traversal filters into PostgreSQL", async () => {
    query.mockReset();
    query
      .mockResolvedValueOnce({ rows: [{ data: { id: "assertion-1", predicate: "depends_on" } }] })
      .mockResolvedValueOnce({ rows: [{ data: { id: "relationship-1", subject: "entity-1" } }] });

    const storage = createPostgresStorage("postgres://test");
    const traversal = storage.createQueryTraversalService();

    await expect(traversal.assertions.findByPredicate("depends_on")).resolves.toHaveLength(1);
    await expect(traversal.relationships.findBySubject("entity-1" as never)).resolves.toHaveLength(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      "SELECT data FROM assertions WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["predicate", "depends_on"],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      "SELECT data FROM relationships WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["subject", "entity-1"],
    );
  });

  it("pushes evidence and source traversal filters into PostgreSQL", async () => {
    query.mockReset();
    query
      .mockResolvedValueOnce({ rows: [{ data: { id: "source-1", kind: "document" } }] })
      .mockResolvedValueOnce({ rows: [{ data: { id: "evidence-1", sourceId: "source-1" } }] });

    const storage = createPostgresStorage("postgres://test");
    const traversal = storage.createQueryEvidenceTraversalService();

    await expect(traversal.sources.findByKind("document" as never)).resolves.toHaveLength(1);
    await expect(traversal.evidence.findBySource("source-1" as never)).resolves.toHaveLength(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      "SELECT data FROM sources WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["kind", "document"],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      "SELECT data FROM evidence WHERE data ->> $1 = $2 ORDER BY id ASC",
      ["sourceId", "source-1"],
    );
  });

  it("uses JSONB containment for derivation input assertions and live SQL for provenance", async () => {
    query.mockReset();
    query
      .mockResolvedValueOnce({ rows: [{ data: { id: "derivation-1", inputAssertionIds: ["assertion-1"] } }] })
      .mockResolvedValueOnce({ rows: [{ data: { id: "provenance-1", subject: { sourceId: "source-1" } } }] });

    const storage = createPostgresStorage("postgres://test");
    const traversal = storage.createQueryEvidenceTraversalService();

    await expect(traversal.derivations.findByInputAssertion("assertion-1" as never)).resolves.toHaveLength(1);
    await expect(traversal.provenance.findBySubjectId("source-1" as never)).resolves.toHaveLength(1);

    expect(query).toHaveBeenNthCalledWith(
      1,
      "SELECT data FROM derivations WHERE data -> $1 @> $2::jsonb ORDER BY id ASC",
      ["inputAssertionIds", JSON.stringify(["assertion-1"])],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("FROM provenance"),
      ["source-1"],
    );
  });

  it("keeps traversal capabilities read-only", () => {
    const storage = createPostgresStorage("postgres://test");
    const traversal = storage.createQueryTraversalService();
    const evidenceTraversal = storage.createQueryEvidenceTraversalService();

    expect(traversal.entities).not.toHaveProperty("save");
    expect(traversal.assertions).not.toHaveProperty("save");
    expect(traversal.relationships).not.toHaveProperty("save");
    expect(evidenceTraversal.sources).not.toHaveProperty("save");
    expect(evidenceTraversal.evidence).not.toHaveProperty("save");
    expect(evidenceTraversal.derivations).not.toHaveProperty("save");
    expect(evidenceTraversal.provenance).not.toHaveProperty("save");
    expect(traversal).not.toHaveProperty("commit");
    expect(traversal).not.toHaveProperty("rollback");
  });
});
