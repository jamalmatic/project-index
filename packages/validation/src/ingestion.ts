import type { AssertionInput, EntityInput, RelationshipInput } from "@project-index/domain";
import { createProvenanceRecord, type EvidenceInput, type ProvenanceRecord, type SourceInput, type Source } from "@project-index/evidence";
import type { Assertion, Entity, Relationship } from "@project-index/domain";
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
  readonly evidence: readonly import("@project-index/evidence").Evidence[];
  readonly provenance: readonly ProvenanceRecord[];
}

export type IngestionWriterFactory = () => Promise<ValidatedWriter>;

/** Construct, validate and persist one ingestion batch atomically. */
export class IngestionService {
  constructor(private readonly createWriter: IngestionWriterFactory) {}

  async ingest(input: IngestionInput): Promise<IngestionResult> {
    const operations: ValidatedWriteOperation[] = [
      { kind: "source", input: input.source },
      ...(input.entities ?? []).map((value) => ({ kind: "entity" as const, input: value })),
      ...(input.assertions ?? []).map((value) => ({ kind: "assertion" as const, input: value })),
      ...(input.relationships ?? []).map((value) => ({ kind: "relationship" as const, input: value })),
      ...(input.evidence ?? []).map((value) => ({ kind: "evidence" as const, input: value })),
    ];

    const writer = await this.createWriter();
    const values = await writer.createMany(operations);
    const entityCount = input.entities?.length ?? 0;
    const assertionCount = input.assertions?.length ?? 0;
    const relationshipCount = input.relationships?.length ?? 0;
    const source = values[0] as Source;
    const entities = values.slice(1, 1 + entityCount) as Entity[];
    const assertions = values.slice(1 + entityCount, 1 + entityCount + assertionCount) as Assertion[];
    const relationships = values.slice(1 + entityCount + assertionCount, 1 + entityCount + assertionCount + relationshipCount) as Relationship[];
    const evidence = values.slice(1 + entityCount + assertionCount + relationshipCount) as IngestionResult["evidence"];
    const provenance = (input.provenance ?? []).map(createProvenanceRecord);

    return { source, entities, assertions, relationships, evidence, provenance };
  }
}
