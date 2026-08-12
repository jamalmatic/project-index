import type { AssertionInput, EntityInput, RelationshipInput } from "@project-index/domain";
import type { EvidenceInput, SourceInput } from "@project-index/evidence";
import type { ValidatedWriter } from "@project-index/validation";

/** Phase 2.8 command boundary: application use-cases depend on a writer factory, not persistence. */
export interface CommandService {
  createEntity(input: EntityInput): ReturnType<ValidatedWriter["createEntity"]>;
  createAssertion(input: AssertionInput): ReturnType<ValidatedWriter["createAssertion"]>;
  createRelationship(input: RelationshipInput): ReturnType<ValidatedWriter["createRelationship"]>;
  createEvidence(input: EvidenceInput): ReturnType<ValidatedWriter["createEvidence"]>;
  createSource(input: SourceInput): Promise<Awaited<ReturnType<ValidatedWriter["createMany"]>>[number]>;
}

export type WriterFactory = () => Promise<ValidatedWriter>;

export const createCommandService = (createWriter: WriterFactory): CommandService => ({
  createEntity: async (input) => (await createWriter()).createEntity(input),
  createAssertion: async (input) => (await createWriter()).createAssertion(input),
  createRelationship: async (input) => (await createWriter()).createRelationship(input),
  createEvidence: async (input) => (await createWriter()).createEvidence(input),
  createSource: async (input) => {
    const [result] = await (await createWriter()).createMany([{ kind: "source", input }]);
    if (!result) throw new Error("Source command produced no result");
    return result;
  },
});
