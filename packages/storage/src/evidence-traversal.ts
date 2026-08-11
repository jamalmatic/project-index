import type { AssertionId, EntityId } from "@project-index/core";
import type {
  Derivation,
  Evidence,
  EvidenceId,
  ProvenanceId,
  ProvenanceRecord,
  Source,
  SourceId,
} from "@project-index/evidence";
import type { DerivationId } from "@project-index/evidence";

export interface EvidenceTraversal {
  findBySource(sourceId: SourceId): Promise<readonly Evidence[]>;
  findByAssertion(assertionId: AssertionId): Promise<readonly Evidence[]>;
  findByEntity(entityId: EntityId): Promise<readonly Evidence[]>;
}

export interface DerivationTraversal {
  findByOutputAssertion(assertionId: AssertionId): Promise<readonly Derivation[]>;
  findByInputAssertion(assertionId: AssertionId): Promise<readonly Derivation[]>;
  findByRule(ruleId: string): Promise<readonly Derivation[]>;
}

export interface ProvenanceTraversal {
  findBySubjectId(id: SourceId | EvidenceId | AssertionId | EntityId): Promise<readonly ProvenanceRecord[]>;
}

export interface SourceTraversal {
  findByKind(kind: Source["kind"]): Promise<readonly Source[]>;
}

export interface QueryEvidenceTraversalService {
  readonly sources: SourceTraversal;
  readonly evidence: EvidenceTraversal;
  readonly derivations: DerivationTraversal;
  readonly provenance: ProvenanceTraversal;
}

const byId = <T extends { readonly id: string }>(records: readonly T[]): readonly T[] =>
  [...records].sort((a, b) => a.id.localeCompare(b.id));

export const createQueryEvidenceTraversalService = (input: {
  readonly sources: readonly Source[];
  readonly evidence: readonly Evidence[];
  readonly derivations: readonly Derivation[];
  readonly provenance: readonly ProvenanceRecord[];
}): QueryEvidenceTraversalService => ({
  sources: {
    findByKind: async (kind) => byId(input.sources.filter((source) => source.kind === kind)),
  },
  evidence: {
    findBySource: async (sourceId) => byId(input.evidence.filter((evidence) => evidence.sourceId === sourceId)),
    findByAssertion: async (assertionId) =>
      byId(input.evidence.filter((evidence) => evidence.assertionId === assertionId)),
    findByEntity: async (entityId) => byId(input.evidence.filter((evidence) => evidence.entityId === entityId)),
  },
  derivations: {
    findByOutputAssertion: async (assertionId) =>
      byId(input.derivations.filter((derivation) => derivation.outputAssertionId === assertionId)),
    findByInputAssertion: async (assertionId) =>
      byId(input.derivations.filter((derivation) => derivation.inputAssertionIds.includes(assertionId))),
    findByRule: async (ruleId) => byId(input.derivations.filter((derivation) => derivation.ruleId === ruleId)),
  },
  provenance: {
    findBySubjectId: async (id) =>
      byId(input.provenance.filter((record) =>
        record.subject.sourceId === id ||
        record.subject.evidenceId === id ||
        record.subject.assertionId === id ||
        record.subject.entityId === id)),
  },
});

export type {
  DerivationId,
  EvidenceId,
  ProvenanceId,
};
