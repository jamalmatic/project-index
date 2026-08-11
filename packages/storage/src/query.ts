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
import type { EvidenceId, SourceId, DerivationId, ProvenanceId } from "@project-index/evidence";

/**
 * Canonical read boundary for Phase 2.6.
 *
 * Query consumers depend only on immutable domain values and never on the
 * concrete persistence implementation.
 */
export interface EntityQuery {
  getById(id: EntityId): Promise<Entity | null>;
}

export interface AssertionQuery {
  getById(id: AssertionId): Promise<Assertion | null>;
}

export interface RelationshipQuery {
  getById(id: RelationshipId): Promise<Relationship | null>;
}

export interface SourceQuery {
  getById(id: SourceId): Promise<Source | null>;
}

export interface EvidenceQuery {
  getById(id: EvidenceId): Promise<Evidence | null>;
}

export interface DerivationQuery {
  getById(id: DerivationId): Promise<Derivation | null>;
}

export interface ProvenanceQuery {
  getById(id: ProvenanceId): Promise<ProvenanceRecord | null>;
}

/** Read-only aggregate query boundary. */
export interface QueryService {
  entities: EntityQuery;
  assertions: AssertionQuery;
  relationships: RelationshipQuery;
  sources: SourceQuery;
  evidence: EvidenceQuery;
  derivations: DerivationQuery;
  provenance: ProvenanceQuery;
}

/**
 * Adapt an existing UnitOfWork to the read-only query boundary.
 * No persistence mutation methods are exposed by the returned value.
 */
export const createQueryService = (unitOfWork: {
  readonly entities: EntityQuery;
  readonly assertions: AssertionQuery;
  readonly relationships: RelationshipQuery;
  readonly sources: SourceQuery;
  readonly evidence: EvidenceQuery;
  readonly derivations: DerivationQuery;
  readonly provenance: ProvenanceQuery;
}): QueryService => ({
  entities: unitOfWork.entities,
  assertions: unitOfWork.assertions,
  relationships: unitOfWork.relationships,
  sources: unitOfWork.sources,
  evidence: unitOfWork.evidence,
  derivations: unitOfWork.derivations,
  provenance: unitOfWork.provenance,
});
