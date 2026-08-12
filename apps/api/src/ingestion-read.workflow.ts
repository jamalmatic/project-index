import type { IngestionInput, IngestionResult } from "@project-index/validation";
import type { UnifiedQueryService } from "@project-index/storage";

export interface IngestionReadWorkflowDependencies {
  readonly ingestion: Pick<{ ingest(input: IngestionInput): Promise<IngestionResult> }, "ingest">;
  readonly query: UnifiedQueryService;
}

export interface IngestionReadBack {
  readonly source: IngestionResult["source"] | null;
  readonly entities: readonly (IngestionResult["entities"][number] | null)[];
  readonly assertions: readonly (IngestionResult["assertions"][number] | null)[];
  readonly relationships: readonly (IngestionResult["relationships"][number] | null)[];
  readonly evidence: readonly (IngestionResult["evidence"][number] | null)[];
  readonly provenance: readonly (IngestionResult["provenance"][number] | null)[];
}

export interface IngestionReadWorkflowResult {
  readonly ingestion: IngestionResult;
  readonly readBack: IngestionReadBack;
}

/**
 * Phase 2.9.1 application workflow: perform a validated ingestion and then
 * read the committed records back through the application's unified query
 * capability. No writer, UnitOfWork, or transaction handle crosses this seam.
 */
export const createIngestionReadWorkflow = ({ ingestion, query }: IngestionReadWorkflowDependencies) => ({
  async execute(input: IngestionInput): Promise<IngestionReadWorkflowResult> {
    const result = await ingestion.ingest(input);

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
      readBack: { source, entities, assertions, relationships, evidence, provenance },
    };
  },
});
