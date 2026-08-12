import { describe, expect, it, vi } from "vitest";
import type { Entity, Assertion } from "@project-index/domain";

const db = vi.hoisted(() => {
  const rows = new Map<string, { data: unknown }>();

  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };

    if (sql.includes("INSERT INTO entities")) {
      rows.set(`entities:${String(params[0])}`, { data: JSON.parse(String(params[1])) });
      return { rows: [] };
    }

    if (sql.includes("INSERT INTO assertions")) {
      rows.set(`assertions:${String(params[0])}`, { data: JSON.parse(String(params[1])) });
      return { rows: [] };
    }

    if (sql.includes("SELECT data FROM entities WHERE id = $1")) {
      const row = rows.get(`entities:${String(params[0])}`);
      return { rows: row ? [row] : [] };
    }

    if (sql.includes("SELECT data FROM assertions WHERE id = $1")) {
      const row = rows.get(`assertions:${String(params[0])}`);
      return { rows: row ? [row] : [] };
    }

    if (sql.includes("data ->> $1 = $2") && sql.includes("FROM entities")) {
      return {
        rows: [...rows.values()].filter((row) => {
          const data = row.data as Record<string, unknown>;
          return sql.includes("FROM entities") && data[String(params[0])] === params[1];
        }),
      };
    }

    if (sql.includes("data ->> $1 = $2") && sql.includes("FROM assertions")) {
      return {
        rows: [...rows.values()].filter((row) => {
          const data = row.data as Record<string, unknown>;
          return sql.includes("FROM assertions") && data[String(params[0])] === params[1];
        }),
      };
    }

    throw new Error(`unexpected SQL: ${sql}`);
  });

  const client = {
    query,
    release: vi.fn(),
  };

  const pool = {
    query,
    connect: vi.fn().mockResolvedValue(client),
    end: vi.fn().mockResolvedValue(undefined),
  };

  return { rows, query, client, pool };
});

vi.mock("pg", () => ({
  Pool: vi.fn(() => db.pool),
}));

import { createPostgresStorage } from "./postgres";

describe("Phase 2.8.13 live unified query read-after-write", () => {
  it("reads a persisted entity through identity and traversal paths after commit", async () => {
    const storage = createPostgresStorage("postgres://test");
    const entity = {
      id: "entity-live-1",
      type: "package",
      properties: {},
    } as Entity;

    const unitOfWork = await storage.createUnitOfWork();
    await unitOfWork.entities.save(entity);
    await unitOfWork.commit();

    const query = storage.createUnifiedQueryService();

    await expect(query.entities.getById(entity.id)).resolves.toEqual(entity);
    await expect(query.entities.findByType(entity.type)).resolves.toEqual([entity]);
    expect(query.entities).not.toHaveProperty("save");
    expect(query.entities).not.toHaveProperty("commit");
    expect(query.entities).not.toHaveProperty("rollback");
  });

  it("reads a persisted assertion through identity and predicate traversal paths after commit", async () => {
    const storage = createPostgresStorage("postgres://test");
    const assertion = {
      id: "assertion-live-1",
      subject: "entity-live-1",
      predicate: "dependsOn",
      object: "entity-live-2",
    } as Assertion;

    const unitOfWork = await storage.createUnitOfWork();
    await unitOfWork.assertions.save(assertion);
    await unitOfWork.commit();

    const query = storage.createUnifiedQueryService();

    await expect(query.assertions.getById(assertion.id)).resolves.toEqual(assertion);
    await expect(query.assertions.findByPredicate(assertion.predicate)).resolves.toEqual([assertion]);
    expect(query.assertions).not.toHaveProperty("save");
    expect(query.assertions).not.toHaveProperty("commit");
    expect(query.assertions).not.toHaveProperty("rollback");
  });

  it("does not use an in-memory traversal snapshot", async () => {
    const storage = createPostgresStorage("postgres://test");
    const entity = { id: "entity-live-2", type: "service", properties: {} } as Entity;

    const unitOfWork = await storage.createUnitOfWork();
    await unitOfWork.entities.save(entity);
    await unitOfWork.commit();

    db.query.mockClear();
    const query = storage.createUnifiedQueryService();
    await query.entities.findByType("service");

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("SELECT data FROM entities"),
      ["type", "service"],
    );
  });
});
