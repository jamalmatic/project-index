import { Pool, type PoolClient } from "pg";
import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence, Source, Derivation, ProvenanceRecord } from "@project-index/evidence";
import type { AssertionId, EntityId, RelationshipId } from "@project-index/core";
import type { EvidenceId, SourceId, DerivationId, ProvenanceId } from "@project-index/evidence";
import type { QueryService } from "./query";
import type { AssertionRepository, EntityRepository, EvidenceRepository, RelationshipRepository, SourceRepository, DerivationRepository, ProvenanceRepository, UnitOfWork } from "./repository";

interface Persisted { readonly id: string }

class PostgresRepository<T extends Persisted> {
  constructor(private readonly client: PoolClient, private readonly table: string) {}
  async getById(id: string): Promise<T | null> {
    const result = await this.client.query<{ data: T }>(`SELECT data FROM ${this.table} WHERE id = $1`, [id]);
    return result.rows[0]?.data ?? null;
  }
  async save(value: T): Promise<void> {
    await this.client.query(
      `INSERT INTO ${this.table} (id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
      [value.id, JSON.stringify(value)],
    );
  }
}

class PostgresReadRepository<T extends Persisted> {
  constructor(private readonly pool: Pool, private readonly table: string) {}
  async getById(id: string): Promise<T | null> {
    const result = await this.pool.query<{ data: T }>(`SELECT data FROM ${this.table} WHERE id = $1`, [id]);
    return result.rows[0]?.data ?? null;
  }
}

export class PostgresEntityRepository implements EntityRepository {
  private readonly repository: PostgresRepository<Entity>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "entities"); }
  getById(id: EntityId) { return this.repository.getById(id); }
  save(entity: Entity) { return this.repository.save(entity); }
}
export class PostgresAssertionRepository implements AssertionRepository {
  private readonly repository: PostgresRepository<Assertion>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "assertions"); }
  getById(id: AssertionId) { return this.repository.getById(id); }
  save(assertion: Assertion) { return this.repository.save(assertion); }
}
export class PostgresRelationshipRepository implements RelationshipRepository {
  private readonly repository: PostgresRepository<Relationship>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "relationships"); }
  getById(id: RelationshipId) { return this.repository.getById(id); }
  save(relationship: Relationship) { return this.repository.save(relationship); }
}
export class PostgresSourceRepository implements SourceRepository {
  private readonly repository: PostgresRepository<Source>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "sources"); }
  getById(id: SourceId) { return this.repository.getById(id); }
  save(source: Source) { return this.repository.save(source); }
}
export class PostgresEvidenceRepository implements EvidenceRepository {
  private readonly repository: PostgresRepository<Evidence>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "evidence"); }
  getById(id: EvidenceId) { return this.repository.getById(id); }
  save(evidence: Evidence) { return this.repository.save(evidence); }
}
export class PostgresDerivationRepository implements DerivationRepository {
  private readonly repository: PostgresRepository<Derivation>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "derivations"); }
  getById(id: DerivationId) { return this.repository.getById(id); }
  save(derivation: Derivation) { return this.repository.save(derivation); }
}
export class PostgresProvenanceRepository implements ProvenanceRepository {
  private readonly repository: PostgresRepository<ProvenanceRecord>;
  constructor(client: PoolClient) { this.repository = new PostgresRepository(client, "provenance"); }
  getById(id: ProvenanceId) { return this.repository.getById(id); }
  save(provenance: ProvenanceRecord) { return this.repository.save(provenance); }
}

export class PostgresUnitOfWork implements UnitOfWork {
  readonly entities: EntityRepository;
  readonly assertions: AssertionRepository;
  readonly relationships: RelationshipRepository;
  readonly sources: SourceRepository;
  readonly evidence: EvidenceRepository;
  readonly derivations: DerivationRepository;
  readonly provenance: ProvenanceRepository;
  private finished = false;

  constructor(private readonly client: PoolClient) {
    this.entities = new PostgresEntityRepository(client);
    this.assertions = new PostgresAssertionRepository(client);
    this.relationships = new PostgresRelationshipRepository(client);
    this.sources = new PostgresSourceRepository(client);
    this.evidence = new PostgresEvidenceRepository(client);
    this.derivations = new PostgresDerivationRepository(client);
    this.provenance = new PostgresProvenanceRepository(client);
  }

  async commit(): Promise<void> {
    if (this.finished) return;
    try { await this.client.query("COMMIT"); this.finished = true; }
    catch (error) {
      try { await this.client.query("ROLLBACK"); }
      finally { this.finished = true; this.client.release(); }
      throw error;
    }
    this.client.release();
  }
  async rollback(): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    try { await this.client.query("ROLLBACK"); }
    finally { this.client.release(); }
  }
}

export interface PostgresStorage {
  pool: Pool;
  createUnitOfWork(): Promise<PostgresUnitOfWork>;
  createQueryService(): QueryService;
  close(): Promise<void>;
}

export const createPostgresStorage = (connectionString: string): PostgresStorage => {
  const pool = new Pool({ connectionString });
  const createQueryService = (): QueryService => ({
    entities: { getById: (id) => new PostgresReadRepository<Entity>(pool, "entities").getById(id) },
    assertions: { getById: (id) => new PostgresReadRepository<Assertion>(pool, "assertions").getById(id) },
    relationships: { getById: (id) => new PostgresReadRepository<Relationship>(pool, "relationships").getById(id) },
    sources: { getById: (id) => new PostgresReadRepository<Source>(pool, "sources").getById(id) },
    evidence: { getById: (id) => new PostgresReadRepository<Evidence>(pool, "evidence").getById(id) },
    derivations: { getById: (id) => new PostgresReadRepository<Derivation>(pool, "derivations").getById(id) },
    provenance: { getById: (id) => new PostgresReadRepository<ProvenanceRecord>(pool, "provenance").getById(id) },
  });
  return {
    pool,
    createUnitOfWork: async () => {
      const client = await pool.connect();
      try { await client.query("BEGIN"); return new PostgresUnitOfWork(client); }
      catch (error) { client.release(); throw error; }
    },
    createQueryService,
    close: () => pool.end(),
  };
};
