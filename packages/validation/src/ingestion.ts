import {
  createAssertion,
  createEntity,
  createRelationship,
  type Assertion,
  type AssertionInput,
  type Entity,
  type EntityInput,
  type Relationship,
  type RelationshipInput,
} from "@project-index/domain";
import {
  createEvidence,
  createProvenanceRecord,
  createSource,
  type Evidence,
  type EvidenceInput,
  type ProvenanceRecord,
  type Source,
  type SourceInput,
} from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { ValidatedWriter, type ValidatedWriteOperation } from "./writer";

export interface IngestionInput {
  readonly source: SourceInput;
  readonly entities?: readonly EntityInput[];
  readonly assertions?: readonly AssertionInput[];
  readonly relationships?: readonly RelationshipInput[];
  readonly evidence?: readonly EvidenceInput[];
  readonly provenance?: readonly {
    readonly id: string;
    readonly subject: Parameters<typeof createProvenanceRecord>[0]["subject"];
    readonly generatedBy?: string;
    readonly recordedAt?: string;
    readonly agent?: string;
    readonly properties?: Readonly<Record<string, unknown>>;
  }[];
}

export interface IngestionResult {
  readonly source: Source;
  readonly entities: readonly Entity[];
  readonly assertions: readonly Assertion[];
  readonly relationships: readonly Relationship[];
  readonly evidence: readonly Evidence[];
  readonly provenance: readonly ProvenanceRecord[];
}

/**
 * Deterministic ingestion boundary. Construction happens before persistence;
 * validated writes are committed as one unit and rolled back on failure.
 * Provenance is returned as part of the ingestion result and is intentionally
 * not persisted until the provenance repository contract is introduced.
 */
export class IngestionService {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async ingest(input: IngestionInput): Promise<IngestionResult> {
    const source = createSource(input.source);
    const entities = (input.entities ?? []).map(createEntity);
    const assertions = (input.assertions ?? []).map(createAssertion);
    const relationships = (input.relationships ?? []).map(createRelationship);
    const evidence = (input.evidence ?? []).map(createEvidence);
    const provenance = (input.provenance ?? []).map(createProvenanceRecord);

    const operations: ValidatedWriteOperation[] = [
      { kind: "entity", input: entities.map((value) => value)[0] ? input.entities![0] : undefined! },
      ...assertions.map((_, index) => ({ kind: "assertion" as const, input: input.assertions![index] })),
      ...relationships.map((_, index) => ({ kind: "relationship" as const, input: input.relationships![index] })),
      ...evidence.map((_, index) => ({ kind: "evidence" as const, input: input.evidence![index] })),
    ];

    if (!input.entities?.length) operations.shift();

    const writer = new ValidatedWriter({ unitOfWork: this.unitOfWork });
    await writer.createMany(operations);
    await this.unitOfWork.sources.save(source);
    await this.unitOfWork.commit();

    return { source, entities, assertions, relationships, evidence, provenance };
  }
}
