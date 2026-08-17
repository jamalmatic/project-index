import type { IngestionInput, IngestionResult } from "@project-index/validation";
import type { UnifiedQueryService } from "@project-index/storage";
import { toApplicationError } from "./errors";

export interface IngestionReadWorkflowDependencies {
  readonly ingestion: Pick<{ ingest(input: IngestionInput): Promise<IngestionResult> }, "ingest">;
  readonly query: UnifiedQueryService;
}

export interface IngestionReadBack {
  readonly source: IngestionResult["source"];
  readonly entities: readonly IngestionResult["entities"][number][];
  readonly assertions: readonly IngestionResult["assertions"][number][];
  readonly relationships: readonly IngestionResult["relationships"][number][];
  readonly evidence: readonly IngestionResult["evidence"][number][];
  readonly provenance: readonly IngestionResult["provenance"][number][];
}

export interface IngestionReadWorkflowResult {
  readonly ingestion: IngestionResult;
  readonly readBack: IngestionReadBack;
}

const requireReadBack = <T extends { readonly id: string }>(value: T | null | undefined, kind: string, id: string): T => {
  if (value == null) {
    throw new Error(`Committed ${kind} ${id} was not found during workflow read-back`);
  }
  if (value.id !== id) {
    throw new Error(`Committed ${kind} ${id} was read back as ${value.id}`);
  }
  return value;
};

/**
 * Phase 2.9.1 application workflow: perform a validated ingestion and then
 * read the committed records back through the application's unified query
 * capability. No writer, UnitOfWork, or transaction handle crosses this seam.
 *
 * Phase 2.9.2 locks the workflow error boundary: failures from either the
 * ingestion phase or the committed read-back phase are classified as
 * ApplicationError while preserving an existing ApplicationError unchanged.
 *
 * Phase 2.9.4 locks consistency semantics: every record returned by ingestion
 * must be present in committed read-back. A missing record is a storage
 * consistency failure rather than a nullable successful result.
 *
 * Phase 2.9.7 locks identity consistency: a successful read-back must return
 * the same record identity requested from the committed result, not merely a
 * non-null record at the expected array position.
 *
 * Phase 2.9.8 locks query-scope consistency: read-back queries are derived
 * exclusively from the identities returned by the successful ingestion result.
 * The workflow does not query input-only identities or perform opportunistic
 * extra reads outside that committed result set.
 */
export const createIngestionReadWorkflow = ({ ingestion, query }: IngestionReadWorkflowDependencies) => ({
  async execute(input: IngestionInput): Promise<IngestionReadWorkflowResult> {
    let result: IngestionResult;
    try {
      result = await ingestion.ingest(input);
    } catch (error) {
      throw toApplicationError(error);
    }

    try {
      const [source, entities, assertions, relationships, evidence, provenance] = await Promise.all([
        query.sources.getById(result.source.id),
        Promise.all(result.entities.map(({ id }) => query.entities.getById(id))),
        Promise.all(result.assertions.map(({ id }) => query.assertions.getById(id))),
        Promise.all(result.relationships.map(({ id }) => query.relationships.getById(id))),
        Promise.all(result.evidence.map(({ id }) => query.evidence.getById(id))),
        Promise.all(result.provenance.map(({ id }) => query.provenance.getById(id))),
      ]);

      return {
        ingestion: result,
        readBack: {
          source: requireReadBack(source, "source", result.source.id),
          entities: result.entities.map(({ id }, index) => requireReadBack(entities[index], "entity", id)),
          assertions: result.assertions.map(({ id }, index) => requireReadBack(assertions[index], "assertion", id)),
          relationships: result.relationships.map(({ id }, index) => requireReadBack(relationships[index], "relationship", id)),
          evidence: result.evidence.map(({ id }, index) => requireReadBack(evidence[index], "evidence", id)),
          provenance: result.provenance.map(({ id }, index) => requireReadBack(provenance[index], "provenance", id)),
        },
      };
    } catch (error) {
      throw toApplicationError(error);
    }
  },
});
