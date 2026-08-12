import type { AssertionInput, EntityInput, RelationshipInput } from "@project-index/domain";
import type { EvidenceInput, SourceInput } from "@project-index/evidence";
import type { ValidatedWriter } from "@project-index/validation";
import { toApplicationError } from "./errors";

/** Phase 2.8 command boundary: application use-cases depend on a writer factory, not persistence. */
export interface CommandService {
  createEntity(input: EntityInput): ReturnType<ValidatedWriter["createEntity"]>;
  createAssertion(input: AssertionInput): ReturnType<ValidatedWriter["createAssertion"]>;
  createRelationship(input: RelationshipInput): ReturnType<ValidatedWriter["createRelationship"]>;
  createEvidence(input: EvidenceInput): ReturnType<ValidatedWriter["createEvidence"]>;
  createSource(input: SourceInput): Promise<Awaited<ReturnType<ValidatedWriter["createMany"]>>[number]>;
}

export type WriterFactory = () => Promise<ValidatedWriter>;

const runCommand = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw toApplicationError(error);
  }
};

export const createCommandService = (createWriter: WriterFactory): CommandService => ({
  createEntity: (input) => runCommand(async () => (await createWriter()).createEntity(input)),
  createAssertion: (input) => runCommand(async () => (await createWriter()).createAssertion(input)),
  createRelationship: (input) => runCommand(async () => (await createWriter()).createRelationship(input)),
  createEvidence: (input) => runCommand(async () => (await createWriter()).createEvidence(input)),
  createSource: (input) => runCommand(async () => {
    const [result] = await (await createWriter()).createMany([{ kind: "source", input }]);
    if (!result) throw new Error("Source command produced no result");
    return result;
  }),
});
