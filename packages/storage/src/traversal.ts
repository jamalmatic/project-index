import type { Assertion, Entity, Relationship } from "@project-index/domain";
import type { EntityId } from "@project-index/core";

/**
 * Canonical Phase 2.6 traversal contract.
 *
 * Traversal returns immutable domain values and keeps persistence details out
 * of callers. Ordering is part of the contract: results are deterministic by
 * their canonical IDs.
 */
export interface AssertionTraversal {
  findBySubject(subject: EntityId): Promise<readonly Assertion[]>;
  findByObject(object: EntityId): Promise<readonly Assertion[]>;
  findByPredicate(predicate: string): Promise<readonly Assertion[]>;
}

export interface RelationshipTraversal {
  findBySubject(subject: EntityId): Promise<readonly Relationship[]>;
  findByObject(object: EntityId): Promise<readonly Relationship[]>;
  findByPredicate(predicate: string): Promise<readonly Relationship[]>;
}

export interface EntityTraversal {
  findByType(type: string): Promise<readonly Entity[]>;
}

export interface QueryTraversalService {
  readonly entities: EntityTraversal;
  readonly assertions: AssertionTraversal;
  readonly relationships: RelationshipTraversal;
}

const byId = <T extends { readonly id: string }>(records: readonly T[]): readonly T[] =>
  [...records].sort((a, b) => a.id.localeCompare(b.id));

export const createQueryTraversalService = (input: {
  readonly entities: readonly Entity[];
  readonly assertions: readonly Assertion[];
  readonly relationships: readonly Relationship[];
}): QueryTraversalService => ({
  entities: {
    findByType: async (type) =>
      byId(input.entities.filter((entity) => entity.type === type)),
  },
  assertions: {
    findBySubject: async (subject) =>
      byId(input.assertions.filter((assertion) => assertion.subject === subject)),
    findByObject: async (object) =>
      byId(input.assertions.filter((assertion) => assertion.object === object)),
    findByPredicate: async (predicate) =>
      byId(input.assertions.filter((assertion) => assertion.predicate === predicate)),
  },
  relationships: {
    findBySubject: async (subject) =>
      byId(input.relationships.filter((relationship) => relationship.subject === subject)),
    findByObject: async (object) =>
      byId(input.relationships.filter((relationship) => relationship.object === object)),
    findByPredicate: async (predicate) =>
      byId(input.relationships.filter((relationship) => relationship.predicate === predicate)),
  },
});
