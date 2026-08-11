import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { Evidence, Source, Derivation, ProvenanceRecord } from "@project-index/evidence";
import type { AssertionId, EntityId, RelationshipId } from "@project-index/core";
import type { EvidenceId, SourceId, DerivationId, ProvenanceId } from "@project-index/evidence";

export interface EntityQuery { getById(id: EntityId): Promise<Entity | null>; }
export interface AssertionQuery { getById(id: AssertionId): Promise<Assertion | null>; }
export interface RelationshipQuery { getById(id: RelationshipId): Promise<Relationship | null>; }
export interface SourceQuery { getById(id: SourceId): Promise<Source | null>; }
export interface EvidenceQuery { getById(id: EvidenceId): Promise<Evidence | null>; }
export interface DerivationQuery { getById(id: DerivationId): Promise<Derivation | null>; }
export interface ProvenanceQuery { getById(id: ProvenanceId): Promise<ProvenanceRecord | null>; }

export interface QueryService {
  readonly entities: EntityQuery;
  readonly assertions: AssertionQuery;
  readonly relationships: RelationshipQuery;
  readonly sources: SourceQuery;
  readonly evidence: EvidenceQuery;
  readonly derivations: DerivationQuery;
  readonly provenance: ProvenanceQuery;
}

/** Creates a read-only facade so UnitOfWork mutation methods cannot leak. */
export const createQueryService = (unitOfWork: {
  readonly entities: EntityQuery;
  readonly assertions: AssertionQuery;
  readonly relationships: RelationshipQuery;
  readonly sources: SourceQuery;
  readonly evidence: EvidenceQuery;
  readonly derivations: DerivationQuery;
  readonly provenance: ProvenanceQuery;
}): QueryService => ({
  entities: { getById: (id) => unitOfWork.entities.getById(id) },
  assertions: { getById: (id) => unitOfWork.assertions.getById(id) },
  relationships: { getById: (id) => unitOfWork.relationships.getById(id) },
  sources: { getById: (id) => unitOfWork.sources.getById(id) },
  evidence: { getById: (id) => unitOfWork.evidence.getById(id) },
  derivations: { getById: (id) => unitOfWork.derivations.getById(id) },
  provenance: { getById: (id) => unitOfWork.provenance.getById(id) },
});
