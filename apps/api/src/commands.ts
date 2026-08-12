import type {
  AssertionInput,
  EntityInput,
  EvidenceInput,
  RelationshipInput,
} from "@project-index/domain";
import type { EvidenceInput as SourceEvidenceInput, SourceInput } from "@project-index/evidence";
import type { ValidatedWriter } from "@project-index/validation";

/** Phase 2.8 command boundary: application use-cases depend on the writer capability only. */
export interface CommandService {
  createEntity(input: EntityInput): ReturnType<ValidatedWriter["createEntity"]>;
  createAssertion(input: AssertionInput): ReturnType<ValidatedWriter["createAssertion"]>;
  createRelationship(input: RelationshipInput): ReturnType<ValidatedWriter["createRelationship"]>;
  createEvidence(input: EvidenceInput): ReturnType<ValidatedWriter["createEvidence"]>;
  createSource(input: SourceInput): Promise<Awaited<ReturnType<ValidatedWriter["createMany"]>>[number]>;
}

export const createCommandService = (writer: ValidatedWriter): CommandService => ({
  createEntity: (input) => writer.createEntity(input),
  createAssertion: (input) => writer.createAssertion(input),
  createRelationship: (input) => writer.createRelationship(input),
  createEvidence: (input) => writer.createEvidence(input),
  createSource: async (input) => {
    const [result] = await writer.createMany([{ kind: "source", input }]);
    return result;
  },
});
