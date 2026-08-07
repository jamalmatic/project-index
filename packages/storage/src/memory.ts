import type {
  Assertion,
  Entity,
  Relationship,
} from "@project-index/domain";
import type { Evidence, Source } from "@project-index/evidence";
import type {
  AssertionId,
  EntityId,
  RelationshipId,
} from "@project-index/core";
import type { EvidenceId, SourceId } from "@project-index/evidence";
import type {
  AssertionRepository,
  EntityRepository,
  EvidenceRepository,
  RelationshipRepository,
  SourceRepository,
  UnitOfWork,
} from "./repository";

class MemoryRepository<T extends { readonly id: string }> {
  private readonly items = new Map<string, T>();

  async getById(id: string): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  async save(item: T): Promise<void> {
    this.items.set(item.id, item);
  }
}

export class MemoryEntityRepository implements EntityRepository {
  private readonly repository = new MemoryRepository<Entity>();
  getById(id: EntityId) { return this.repository.getById(id); }
  save(entity: Entity) { return this.repository.save(entity); }
}

export class MemoryAssertionRepository implements AssertionRepository {
  private readonly repository = new MemoryRepository<Assertion>();
  getById(id: AssertionId) { return this.repository.getById(id); }
  save(assertion: Assertion) { return this.repository.save(assertion); }
}

export class MemoryRelationshipRepository implements RelationshipRepository {
  private readonly repository = new MemoryRepository<Relationship>();
  getById(id: RelationshipId) { return this.repository.getById(id); }
  save(relationship: Relationship) { return this.repository.save(relationship); }
}

export class MemorySourceRepository implements SourceRepository {
  private readonly repository = new MemoryRepository<Source>();
  getById(id: SourceId) { return this.repository.getById(id); }
  save(source: Source) { return this.repository.save(source); }
}

export class MemoryEvidenceRepository implements EvidenceRepository {
  private readonly repository = new MemoryRepository<Evidence>();
  getById(id: EvidenceId) { return this.repository.getById(id); }
  save(evidence: Evidence) { return this.repository.save(evidence); }
}

export const createMemoryUnitOfWork = (): UnitOfWork => ({
  entities: new MemoryEntityRepository(),
  assertions: new MemoryAssertionRepository(),
  relationships: new MemoryRelationshipRepository(),
  sources: new MemorySourceRepository(),
  evidence: new MemoryEvidenceRepository(),
  async commit() {},
  async rollback() {},
});
