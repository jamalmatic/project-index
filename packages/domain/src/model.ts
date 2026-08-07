import type {
  AssertionId,
  EntityId,
  RelationshipId,
  TemporalContext,
} from "@project-index/core";

export type EntityType = string & { readonly __brand: "EntityType" };
export type RelationshipType = string & { readonly __brand: "RelationshipType" };

export const entityType = (value: string): EntityType => {
  if (!value.trim()) throw new Error("Entity type must not be empty");
  return value as EntityType;
};

export const relationshipType = (value: string): RelationshipType => {
  if (!value.trim()) throw new Error("Relationship type must not be empty");
  return value as RelationshipType;
};

export interface IdentityReference {
  readonly canonicalId: EntityId;
  readonly externalIds: Readonly<Record<string, string>>;
}

export interface Entity {
  readonly id: EntityId;
  readonly type: EntityType;
  readonly identity: IdentityReference;
  readonly temporal?: TemporalContext;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface Relationship {
  readonly id: RelationshipId;
  readonly subject: EntityId;
  readonly predicate: RelationshipType;
  readonly object: EntityId;
  readonly temporal?: TemporalContext;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface Assertion {
  readonly id: AssertionId;
  readonly subject: EntityId;
  readonly predicate: RelationshipType;
  readonly object: EntityId;
  readonly temporal?: TemporalContext;
  readonly properties: Readonly<Record<string, unknown>>;
}
