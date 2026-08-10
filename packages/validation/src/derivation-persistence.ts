import type { UnitOfWork } from "@project-index/storage";
import { createProvenanceRecord, provenanceId, type ProvenanceRecord } from "@project-index/evidence";
import type { Assertion } from "@project-index/domain";
import { executeDerivation, type DerivationExecutionInput, type DerivationExecutionResult } from "./derivation";

export interface PersistedDerivationResult extends DerivationExecutionResult {
  readonly provenance: ProvenanceRecord;
}

export interface DerivationPersistenceInput extends DerivationExecutionInput {
  readonly unitOfWork: UnitOfWork;
  readonly provenanceId?: string;
}

const createOutputProvenance = (
  input: DerivationPersistenceInput,
  assertion: Assertion,
): ProvenanceRecord =>
  createProvenanceRecord({
    id: provenanceId(input.provenanceId ?? `${input.derivationId}:output`),
    subject: { role: "assertion", assertionId: assertion.id },
    generatedBy: `${input.rule.id}@${input.rule.version}`,
    ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
    properties: {
      derivationId: input.derivationId,
      inputAssertionIds: input.inputAssertions.map((candidate) => candidate.id),
      evidenceIds: [...(input.evidenceIds ?? [])],
    },
  });

export const persistDerivation = async (
  input: DerivationPersistenceInput,
): Promise<PersistedDerivationResult> => {
  try {
    const result = await executeDerivation(input);
    const provenance = createOutputProvenance(input, result.assertion);

    await input.unitOfWork.assertions.save(result.assertion);
    await input.unitOfWork.derivations.save(result.derivation);
    await input.unitOfWork.provenance.save(provenance);
    await input.unitOfWork.commit();

    return { ...result, provenance };
  } catch (error) {
    await input.unitOfWork.rollback();
    throw error;
  }
};
