import { describe, expect, it, vi } from "vitest";
import { PostgresEntityRepository, PostgresUnitOfWork } from "./postgres";
import type { Entity } from "@project-index/domain";

const entity = { id: "entity-1", type: "person", properties: {} } as Entity;

const client = () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  release: vi.fn(),
});

describe("Postgres persistence adapter", () => {
  it("round-trips entity JSON through the repository contract", async () => {
    const db = client();
    vi.mocked(db.query)
      .mockResolvedValueOnce({ rows: [{ data: entity }] })
      .mockResolvedValueOnce({ rows: [] });

    const repository = new PostgresEntityRepository(db as never);

    expect(await repository.getById(entity.id)).toEqual(entity);
    await repository.save(entity);

    expect(db.query).toHaveBeenNthCalledWith(1, "SELECT data FROM entities WHERE id = $1", [entity.id]);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO entities"),
      [entity.id, JSON.stringify(entity)],
    );
  });

  it("commits and releases exactly once", async () => {
    const db = client();
    const uow = new PostgresUnitOfWork(db as never);

    await uow.commit();
    await uow.commit();

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith("COMMIT");
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases exactly once", async () => {
    const db = client();
    const uow = new PostgresUnitOfWork(db as never);

    await uow.rollback();
    await uow.rollback();

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith("ROLLBACK");
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("rolls back a failed commit before releasing the client", async () => {
    const db = client();
    vi.mocked(db.query)
      .mockRejectedValueOnce(new Error("commit failed"))
      .mockResolvedValueOnce({ rows: [] });
    const uow = new PostgresUnitOfWork(db as never);

    await expect(uow.commit()).rejects.toThrow("commit failed");

    expect(db.query).toHaveBeenNthCalledWith(1, "COMMIT");
    expect(db.query).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(db.release).toHaveBeenCalledOnce();
  });
});
