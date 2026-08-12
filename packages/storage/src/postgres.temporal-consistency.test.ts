import { describe, expect, it, vi } from "vitest";
import type { Entity, Assertion } from "@project-index/domain";

const db = vi.hoisted(() => {
  const committed = new Map<string, unknown>();
  let transactionRows = new Map<string, unknown>();
  let inTransaction = false;

  const executeWrite = (sql: string, params: unknown[]) => {
    if (sql.includes("INSERT INTO entities")) {
      transactionRows.set(`entities:${String(params[0])}`, JSON.parse(String(params[1])));
      return { rows: [] };
    }
    if (sql.includes("INSERT INTO assertions")) {
      transactionRows.set(`assertions:${String(params[0])}`, JSON.parse(String(params[1])));
      return { rows: [] };
    }
    throw new Error(`unexpected write SQL: ${sql}`);
  };

  const readCommitted = (sql: string, params: unknown[]) => {
    if (sql.includes("SELECT data FROM entities WHERE id = $1")) {
      const row = committed.get(`entities:${String(params[0])}`);
      return { rows: row === undefined ? [] : [{ data: row }] };
    }
    if (sql.includes("SELECT data FROM assertions WHERE id = $1")) {
      const row = committed.get(`assertions:${String(params[0])}`);
      return { rows: row === undefined ? [] : [{ data: row }] };
    }
    if (sql.includes("FROM entities") && sql.includes("data ->> $1 = $2")) {
      return {
        rows: [...committed.entries()]
          .filter(([key, data]) => key.startsWith("entities:") && (data as Record<string, unknown>)[String(params[0])] === params[1])
          .map(([, data]) => ({ data })),
      };
    }
    if (sql.includes("FROM assertions") && sql.includes("data ->> $1 = $2")) {
      return {
        rows: [...committed.entries()]
          .filter(([key, data]) => key.startsWith("assertions:") && (data as Record<string, unknown>)[String(params[0])] === params[1])
          .map(([, data]) => ({ data })),
      };
    }
    throw new Error(`unexpected read SQL: ${sql}`);
  };

  const client = {
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql === "BEGIN") {
        inTransaction = true;
        transactionRows = new Map();
        return { rows: [] };
      }
      if (sql === "COMMIT") {
        for (const [key, value] of transactionRows) committed.set(key, value);
        transactionRows.clear();
        inTransaction = false;
        return { rows: [] };
      }
      if (sql === "ROLLBACK") {
        transactionRows.clear();
        inTransaction = false;
        return { rows: [] };
      }
      if (!inTransaction) throw new Error("write attempted outside transaction");
      return executeWrite(sql, params);
    }),
    release: vi.fn(),
  };

  const pool = {
    query: vi.fn(async (sql: string, params: unknown[] = []) => readCommitted(sql, params)),
    connect: vi.fn().mockResolvedValue(client),
    end: vi.fn().mockResolvedValue(undefined),
  };

  return { committed, client, pool };
});

vi.mock("pg", () => ({
  Pool: vi.fn(() => db.pool),
}));

import { createPostgresStorage } from "./postgres";

describe("Phase 2.8.14 temporal consistency", () => {
  it("does not expose an uncommitted entity to the independent unified query", async () => {
    const storage = createPostgresStorage("postgres://test");
    const entity = { id: "temporal-entity-1", type: "package", properties: {} } as Entity;
    const unitOfWork = await storage.createUnitOfWork();

    await unitOfWork.entities.save(entity);
    const query = storage.createUnifiedQueryService();

    await expect(query.entities.getById(entity.id)).resolves.toBeNull();
    await expect(query.entities.findByType(entity.type)).resolves.toEqual([]);

    await unitOfWork.commit();
    await expect(query.entities.getById(entity.id)).resolves.toEqual(entity);
    await expect(query.entities.findByType(entity.type)).resolves.toEqual([entity]);
  });

  it("keeps rolled-back writes invisible to identity and traversal reads", async () => {
    const storage = createPostgresStorage("postgres://test");
    const assertion = {
      id: "temporal-assertion-1",
      subject: "entity-1",
      predicate: "dependsOn",
      object: "entity-2",
    } as Assertion;
    const unitOfWork = await storage.createUnitOfWork();

    await unitOfWork.assertions.save(assertion);
    await unitOfWork.rollback();

    const query = storage.createUnifiedQueryService();
    await expect(query.assertions.getById(assertion.id)).resolves.toBeNull();
    await expect(query.assertions.findByPredicate(assertion.predicate)).resolves.toEqual([]);
  });

  it("makes a committed batch visible through independent query reads", async () => {
    const storage = createPostgresStorage("postgres://test");
    const first = { id: "temporal-entity-2", type: "service", properties: {} } as Entity;
    const second = { id: "temporal-entity-3", type: "service", properties: {} } as Entity;
    const unitOfWork = await storage.createUnitOfWork();

    await unitOfWork.entities.save(first);
    await unitOfWork.entities.save(second);

    const query = storage.createUnifiedQueryService();
    await expect(query.entities.findByType("service")).resolves.toEqual([]);

    await unitOfWork.commit();
    await expect(query.entities.findByType("service")).resolves.toEqual([first, second]);
  });

  it("does not make a transaction-aware query surface part of the public read contract", () => {
    const storage = createPostgresStorage("postgres://test");
    const query = storage.createUnifiedQueryService();

    expect(query).not.toHaveProperty("unitOfWork");
    expect(query).not.toHaveProperty("transaction");
    expect(query).not.toHaveProperty("commit");
    expect(query).not.toHaveProperty("rollback");
  });
});
