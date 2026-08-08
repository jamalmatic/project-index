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
  type Evidence,
  type EvidenceInput,
} from "@project-index/evidence";
import type { UnitOfWork } from "@project-index/storage";
import { createValidationResult, type ValidationResult } from "./model";
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
  | { readonly kind: "entity"; readonly input: EntityInput }
  | { readonly kind: "assertion"; readonly input: AssertionInput }
  | { readonly kind: "relationship"; readonly input: RelationshipInput }
  | { readonly kind: "evidence"; readonly input: EvidenceInput };

export type ValidatedWriteResult = Entity | Assertion | Relationship | Evidence;
type PreparedWrite =
  | { readonly kind: "entity"; readonly value: Entity }
  | { readonly kind: "assertion"; readonly value: Assertion }
  | { readonly kind: "relationship"; readonly value: Relationship }
  | { readonly kind: "evidence"; readonly value: Evidence };

export class ValidatedWriter {
  private readonly unitOfWork: UnitOfWork;
  private readonly context: ValidationContext;

  constructor(options: ValidatedWriterOptions) {
    this.unitOfWork = options.unitOfWork;
    this.context = {
      unitOfWork: options.unitOfWork,
      ...(options.consistency ? { consistency: options.consistency } : {}),
    };
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
    const issues: ValidationResult["issues"] = [];

    for (const operation of operations) {
      const result = await this.prepare(operation);
      prepared.push(result.value);
      issues.push(...result.issues);
    }

    if (issues.length) {
      throw new ValidationError(createValidationResult({ subjectId: "validation:batch", issues }));
    }

    try {
      for (const operation of prepared) {
        await this.save(operation);
      }
      await this.unitOfWork.commit();
      return prepared.map(({ value }) => value);
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }

  private async prepare(operation: ValidatedWriteOperation): Promise<{ value: PreparedWrite; issues: ValidationResult["issues"] }> {
    switch (operation.kind) {
      case "entity": {
        const value = createEntity(operation.input);
        return { value: { kind: "entity", value }, issues: [] };
      }
      case "assertion": {
        const value = createAssertion(operation.input);
        const result = await validateAssertion(value, this.context);
        return { value: { kind: "assertion", value }, issues: result.issues };
      }
      case "relationship": {
        const value = createRelationship(operation.input);
        const result = await validateRelationship(value, this.context);
        return { value: { kind: "relationship", value }, issues: result.issues };
      }
      case "evidence": {
        const value = createEvidence(operation.input);
        const result = await validateEvidence(value, this.context);
        return { value: { kind: "evidence", value }, issues: result.issues };
      }
    }
  }

  private async save(operation: PreparedWrite): Promise<void> {
    switch (operation.kind) {
      case "entity":
        await this.unitOfWork.entities.save(operation.value);
        return;
      case "assertion":
        await this.unitOfWork.assertions.save(operation.value);
        return;
      case "relationship":
        await this.unitOfWork.relationships.save(operation.value);
        return;
      case "evidence":
        await this.unitOfWork.evidence.save(operation.value);
        return;
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
