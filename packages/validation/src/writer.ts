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
import { createEvidence, createSource, type Evidence, type EvidenceInput, type Source, type SourceInput } from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationResult, type ValidationIssue, type ValidationResult } from "./model";
import { validateAssertion, validateEvidence, validateRelationship, type ValidationContext } from "./orchestrator";

export class ValidationError extends Error {
  readonly result: ValidationResult;
  constructor(result: ValidationResult) {
    super(`Validation failed with ${result.issues.length} issue(s)`);
    this.name = "ValidationError";
    this.result = result;
  }
}

export interface ValidatedWriterOptions {
  readonly unitOfWork: UnitOfWork;
  readonly consistency?: ValidationContext["consistency"];
}

export type ValidatedWriteOperation =
  | { readonly kind: "source"; readonly input: SourceInput }
  | { readonly kind: "entity"; readonly input: EntityInput }
  | { readonly kind: "assertion"; readonly input: AssertionInput }
  | { readonly kind: "relationship"; readonly input: RelationshipInput }
  | { readonly kind: "evidence"; readonly input: EvidenceInput };

export type ValidatedWriteResult = Source | Entity | Assertion | Relationship | Evidence;
type PreparedWrite =
  | { readonly kind: "source"; readonly value: Source }
  | { readonly kind: "entity"; readonly value: Entity }
  | { readonly kind: "assertion"; readonly value: Assertion }
  | { readonly kind: "relationship"; readonly value: Relationship }
  | { readonly kind: "evidence"; readonly value: Evidence };

type StagedReferences = {
  readonly entityIds: Set<string>;
  readonly assertionIds: Set<string>;
  readonly sourceIds: Set<string>;
};

export class ValidatedWriter {
  private readonly unitOfWork: UnitOfWork;
  private readonly context: ValidationContext;

  constructor(options: ValidatedWriterOptions) {
    this.unitOfWork = options.unitOfWork;
    this.context = { unitOfWork: options.unitOfWork, ...(options.consistency ? { consistency: options.consistency } : {}) };
  }

  async createEntity(input: EntityInput): Promise<Entity> {
    const entity = createEntity(input);
    const result = createValidationResult({ subjectId: entity.id });
    if (result.issues.length) throw new ValidationError(result);
    await this.write(() => this.unitOfWork.entities.save(entity));
    return entity;
  }

  async createAssertion(input: AssertionInput): Promise<Assertion> {
    const assertion = createAssertion(input);
    await this.requireValid(validateAssertion(assertion, this.context));
    await this.write(() => this.unitOfWork.assertions.save(assertion));
    return assertion;
  }

  async createRelationship(input: RelationshipInput): Promise<Relationship> {
    const relationship = createRelationship(input);
    await this.requireValid(validateRelationship(relationship, this.context));
    await this.write(() => this.unitOfWork.relationships.save(relationship));
    return relationship;
  }

  async createEvidence(input: EvidenceInput): Promise<Evidence> {
    const evidence = createEvidence(input);
    await this.requireValid(validateEvidence(evidence, this.context));
    await this.write(() => this.unitOfWork.evidence.save(evidence));
    return evidence;
  }

  async createMany(operations: readonly ValidatedWriteOperation[]): Promise<readonly ValidatedWriteResult[]> {
    const prepared: PreparedWrite[] = [];
    const issues: ValidationIssue[] = [];
    const staged: StagedReferences = { entityIds: new Set(), assertionIds: new Set(), sourceIds: new Set() };
    try {
      // Prepare and validate the complete batch before mutating any repository.
      // Staged IDs make references between members of the same batch resolvable.
      for (const operation of operations) {
        const result = await this.prepare(operation, staged);
        if (result.issues.length) issues.push(...result.issues);
        else {
          prepared.push(result.value);
          this.stage(result.value, staged);
        }
      }

      if (issues.length) {
        throw new ValidationError(createValidationResult({ subjectId: "validation:batch", issues }));
      }

      for (const value of prepared) await this.save(value);
      await this.unitOfWork.commit();
      return prepared.map(({ value }) => value);
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }

  private async prepare(
    operation: ValidatedWriteOperation,
    staged: StagedReferences,
  ): Promise<{ value: PreparedWrite; issues: readonly ValidationIssue[] }> {
    const context: ValidationContext = { ...this.context, staged };
    switch (operation.kind) {
      case "source": return { value: { kind: "source", value: createSource(operation.input) }, issues: [] };
      case "entity": {
        const value = createEntity(operation.input);
        return { value: { kind: "entity", value }, issues: [] };
      }
      case "assertion": {
        const value = createAssertion(operation.input);
        const result = await validateAssertion(value, context);
        return { value: { kind: "assertion", value }, issues: result.issues };
      }
      case "relationship": {
        const value = createRelationship(operation.input);
        const result = await validateRelationship(value, context);
        return { value: { kind: "relationship", value }, issues: result.issues };
      }
      case "evidence": {
        const value = createEvidence(operation.input);
        const result = await validateEvidence(value, context);
        return { value: { kind: "evidence", value }, issues: result.issues };
      }
    }
  }

  private stage(operation: PreparedWrite, staged: StagedReferences): void {
    switch (operation.kind) {
      case "source": staged.sourceIds.add(operation.value.id); break;
      case "entity": staged.entityIds.add(operation.value.id); break;
      case "assertion": staged.assertionIds.add(operation.value.id); break;
      case "relationship": break;
      case "evidence": break;
    }
  }

  private async save(operation: PreparedWrite): Promise<void> {
    switch (operation.kind) {
      case "source": return this.unitOfWork.sources.save(operation.value);
      case "entity": return this.unitOfWork.entities.save(operation.value);
      case "assertion": return this.unitOfWork.assertions.save(operation.value);
      case "relationship": return this.unitOfWork.relationships.save(operation.value);
      case "evidence": return this.unitOfWork.evidence.save(operation.value);
    }
  }

  private async requireValid(resultPromise: Promise<ValidationResult>): Promise<void> {
    const result = await resultPromise;
    if (result.issues.length) throw new ValidationError(result);
  }

  private async write(operation: () => Promise<void>): Promise<void> {
    try {
      await operation();
      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
