import { createAssertion, type Assertion, type AssertionInput } from "@project-index/domain";
import { createDerivation, type Derivation, type EvidenceId } from "@project-index/evidence";
import { deepFreeze } from "@project-index/core";

export interface DerivationContext {
  readonly inputAssertions: readonly Assertion[];
  readonly evidenceIds: readonly EvidenceId[];
}

export interface DerivationResult {
  readonly assertion: AssertionInput;
  readonly evidenceIds?: readonly EvidenceId[];
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface DerivationRule {
  readonly id: string;
  readonly version: string;
  derive(context: DerivationContext): Promise<DerivationResult>;
}

export interface DerivationExecutionInput {
  readonly derivationId: string;
  readonly rule: DerivationRule;
  readonly inputAssertions: readonly Assertion[];
  readonly evidenceIds?: readonly EvidenceId[];
  readonly activityId?: string;
  readonly recordedAt?: string;
}

export interface DerivationExecutionResult {
  readonly assertion: Assertion;
  readonly derivation: Derivation;
}

export const executeDerivation = async (
  input: DerivationExecutionInput,
): Promise<DerivationExecutionResult> => {
  if (input.inputAssertions.length === 0) {
    throw new Error("Derivation execution requires at least one input assertion");
  }

  const evidenceIds = [...(input.evidenceIds ?? [])];
  const result = await input.rule.derive({
    inputAssertions: [...input.inputAssertions],
    evidenceIds,
  });
  const assertion = createAssertion(result.assertion);
  const derivationInput = {
  id: input.derivationId,
  outputAssertionId: assertion.id,
  inputAssertionIds: input.inputAssertions.map((candidate) => candidate.id),
  evidenceIds: result.evidenceIds ?? evidenceIds,
  ruleId: `${input.rule.id}@${input.rule.version}`,
  ...(input.activityId ? { activityId: input.activityId } : {}),
  ...(input.recordedAt ? { recordedAt: input.recordedAt } : {}),
  ...(result.properties ? { properties: result.properties } : {}),
};

const derivation = createDerivation(derivationInput);

  return deepFreeze({ assertion, derivation });
};
