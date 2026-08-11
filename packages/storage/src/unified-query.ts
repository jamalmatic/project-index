import type { QueryService } from "./query";
import type { QueryTraversalService } from "./traversal";
import type { QueryEvidenceTraversalService } from "./evidence-traversal";

/**
 * Canonical Phase 2.6.6 read surface. It combines identity reads with
 * traversal reads without exposing persistence mutation or transaction APIs.
 */
export type UnifiedQueryService = QueryService &
  QueryTraversalService &
  QueryEvidenceTraversalService;

export const createUnifiedQueryService = (
  query: QueryService,
  traversal: QueryTraversalService,
  evidenceTraversal: QueryEvidenceTraversalService,
): UnifiedQueryService => ({
  ...query,
  entities: {
    ...query.entities,
    ...traversal.entities,
  },
  assertions: {
    ...query.assertions,
    ...traversal.assertions,
  },
  relationships: {
    ...query.relationships,
    ...traversal.relationships,
  },
  sources: {
    ...query.sources,
    ...evidenceTraversal.sources,
  },
  evidence: {
    ...query.evidence,
    ...evidenceTraversal.evidence,
  },
  derivations: {
    ...query.derivations,
    ...evidenceTraversal.derivations,
  },
  provenance: {
    ...query.provenance,
    ...evidenceTraversal.provenance,
  },
});
