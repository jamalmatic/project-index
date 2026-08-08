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
