import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence, Source } from "@project-index/evidence";
import type { AssertionId, EntityId, RelationshipId } from "@project-index/core";
import type { EvidenceId, SourceId } from "@project-index/evidence";
import type { AssertionRepository, EntityRepository, EvidenceRepository, RelationshipRepository, SourceRepository, UnitOfWork } from "./repository";

class MemoryRepository<T extends { readonly id: string }> {
  constructor(private readonly items: Map<string, T>) {}
  async getById(id: string): Promise<T | null> { return this.items.get(id) ?? null; }
  async save(item: T): Promise<void> { this.items.set(item.id, item); }
}

const repositoryPair = <T extends { readonly id: string }>(committed: Map<string, T>) => {
  const working = new Map(committed);
  return { working, repository: new MemoryRepository(working) };
};

export class MemoryEntityRepository implements EntityRepository {
  private readonly repository: MemoryRepository<Entity>;
  constructor(items = new Map<string, Entity>()) { this.repository = new MemoryRepository(items); }
  getById(id: EntityId) { return this.repository.getById(id); }
  save(entity: Entity) { return this.repository.save(entity); }
}
export class MemoryAssertionRepository implements AssertionRepository {
  private readonly repository: MemoryRepository<Assertion>;
  constructor(items = new Map<string, Assertion>()) { this.repository = new MemoryRepository(items); }
  getById(id: AssertionId) { return this.repository.getById(id); }
  save(assertion: Assertion) { return this.repository.save(assertion); }
}
export class MemoryRelationshipRepository implements RelationshipRepository {
  private readonly repository: MemoryRepository<Relationship>;
  constructor(items = new Map<string, Relationship>()) { this.repository = new MemoryRepository(items); }
  getById(id: RelationshipId) { return this.repository.getById(id); }
  save(relationship: Relationship) { return this.repository.save(relationship); }
}
export class MemorySourceRepository implements SourceRepository {
  private readonly repository: MemoryRepository<Source>;
  constructor(items = new Map<string, Source>()) { this.repository = new MemoryRepository(items); }
  getById(id: SourceId) { return this.repository.getById(id); }
  save(source: Source) { return this.repository.save(source); }
}
export class MemoryEvidenceRepository implements EvidenceRepository {
  private readonly repository: MemoryRepository<Evidence>;
  constructor(items = new Map<string, Evidence>()) { this.repository = new MemoryRepository(items); }
  getById(id: EvidenceId) { return this.repository.getById(id); }
  save(evidence: Evidence) { return this.repository.save(evidence); }
}

export const createMemoryUnitOfWork = (): UnitOfWork => {
  const entities = new Map<string, Entity>();
  const assertions = new Map<string, Assertion>();
  const relationships = new Map<string, Relationship>();
  const sources = new Map<string, Source>();
  const evidence = new Map<string, Evidence>();

  const entityPair = repositoryPair(entities);
  const assertionPair = repositoryPair(assertions);
  const relationshipPair = repositoryPair(relationships);
  const sourcePair = repositoryPair(sources);
  const evidencePair = repositoryPair(evidence);
  let finished = false;

  return {
    entities: new MemoryEntityRepository(entityPair.working),
    assertions: new MemoryAssertionRepository(assertionPair.working),
    relationships: new MemoryRelationshipRepository(relationshipPair.working),
    sources: new MemorySourceRepository(sourcePair.working),
    evidence: new MemoryEvidenceRepository(evidencePair.working),
    async commit() {
      if (finished) return;
      for (const [id, value] of entityPair.working) entities.set(id, value);
      for (const [id, value] of assertionPair.working) assertions.set(id, value);
      for (const [id, value] of relationshipPair.working) relationships.set(id, value);
      for (const [id, value] of sourcePair.working) sources.set(id, value);
      for (const [id, value] of evidencePair.working) evidence.set(id, value);
      finished = true;
    },
    async rollback() { finished = true; },
  };
};
