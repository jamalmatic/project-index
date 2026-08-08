import type { AssertionInput, EntityInput, RelationshipInput } from "@project-index/domain";
import { createProvenanceRecord, type EvidenceInput, type ProvenanceRecord, type SourceInput } from "@project-index/evidence";
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
  readonly source: import("@project-index/evidence").Source;
  readonly entities: readonly import("@project-index/domain").Entity[];
  readonly assertions: readonly import("@project-index/domain").Assertion[];
  readonly relationships: readonly import("@project-index/domain").Relationship[];
  readonly evidence: readonly import("@project-index/evidence").Evidence[];
  readonly provenance: readonly ProvenanceRecord[];
}

/** Construct, validate and persist one ingestion batch atomically. */
export class IngestionService {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async ingest(input: IngestionInput): Promise<IngestionResult> {
    const operations: ValidatedWriteOperation[] = [
      { kind: "source", input: input.source },
      ...(input.entities ?? []).map((value) => ({ kind: "entity" as const, input: value })),
      ...(input.assertions ?? []).map((value) => ({ kind: "assertion" as const, input: value })),
      ...(input.relationships ?? []).map((value) => ({ kind: "relationship" as const, input: value })),
      ...(input.evidence ?? []).map((value) => ({ kind: "evidence" as const, input: value })),
    ];

    const writer = new ValidatedWriter({ unitOfWork: this.unitOfWork });
    await writer.createMany(operations);
    const provenance = (input.provenance ?? []).map(createProvenanceRecord);

    return {
      source: await this.unitOfWork.sources.getById(input.source.id as import("@project-index/evidence").SourceId) as IngestionResult["source"],
      entities: await Promise.all((input.entities ?? []).map(async (item) => this.unitOfWork.entities.getById(item.id as import("@project-index/core").EntityId))) as IngestionResult["entities"],
      assertions: await Promise.all((input.assertions ?? []).map(async (item) => this.unitOfWork.assertions.getById(item.id as import("@project-index/core").AssertionId))) as IngestionResult["assertions"],
      relationships: await Promise.all((input.relationships ?? []).map(async (item) => this.unitOfWork.relationships.getById(item.id as import("@project-index/core").RelationshipId))) as IngestionResult["relationships"],
      evidence: await Promise.all((input.evidence ?? []).map(async (item) => this.unitOfWork.evidence.getById(item.id as import("@project-index/evidence").EvidenceId))) as IngestionResult["evidence"],
      provenance,
    };
  }
}
