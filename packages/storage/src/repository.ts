import type {
  Assertion,
  Entity,
  Relationship,
} from "@project-index/domain";
import type { Evidence, Source, Derivation, ProvenanceRecord } from "@project-index/evidence";
import type {
  AssertionId,
  EntityId,
  RelationshipId,
} from "@project-index/core";
import type { EvidenceId, SourceId } from "@project-index/evidence";
import type { DerivationId, ProvenanceId } from "@project-index/evidence";

export interface EntityRepository {
  getById(id: EntityId): Promise<Entity | null>;
  save(entity: Entity): Promise<void>;
}

export interface AssertionRepository {
  getById(id: AssertionId): Promise<Assertion | null>;
  save(assertion: Assertion): Promise<void>;
}

export interface RelationshipRepository {
  getById(id: RelationshipId): Promise<Relationship | null>;
  save(relationship: Relationship): Promise<void>;
}

export interface SourceRepository {
  getById(id: SourceId): Promise<Source | null>;
  save(source: Source): Promise<void>;
}

export interface EvidenceRepository {
  getById(id: EvidenceId): Promise<Evidence | null>;
  save(evidence: Evidence): Promise<void>;
}

export interface DerivationRepository {
  getById(id: DerivationId): Promise<Derivation | null>;
  save(derivation: Derivation): Promise<void>;
}

export interface ProvenanceRepository {
  getById(id: ProvenanceId): Promise<ProvenanceRecord | null>;
  save(record: ProvenanceRecord): Promise<void>;
}

export interface UnitOfWork {
  entities: EntityRepository;
  assertions: AssertionRepository;
  relationships: RelationshipRepository;
  sources: SourceRepository;
  evidence: EvidenceRepository;
  derivations: DerivationRepository;
  provenance: ProvenanceRepository;

  commit(): Promise<void>;
  rollback(): Promise<void>;
}
