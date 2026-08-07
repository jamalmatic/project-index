import type {
  AssertionId,
  EntityId,
  RelationshipId,
  TemporalContext,
} from "@project-index/core";
import { deepFreeze, entityId, assertionId, relationshipId, createTemporalContext } from "@project-index/core";

export type EntityType = string & { readonly __brand: "EntityType" };
export type RelationshipType = string & { readonly __brand: "RelationshipType" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const entityType = (value: string): EntityType =>
  requiredText(value, "Entity type") as EntityType;

export const relationshipType = (value: string): RelationshipType =>
  requiredText(value, "Relationship type") as RelationshipType;

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

const freezeProperties = (properties: Readonly<Record<string, unknown>>) =>
  deepFreeze({ ...properties });

const createIdentity = (
  canonicalId: EntityId,
  externalIds: Readonly<Record<string, string>> = {},
): IdentityReference => {
  for (const [namespace, value] of Object.entries(externalIds)) {
    requiredText(namespace, "External ID namespace");
    requiredText(value, `External ID for ${namespace}`);
  }

  return deepFreeze({ canonicalId, externalIds: { ...externalIds } });
};

const freezeTemporal = (temporal?: TemporalContext) =>
  temporal ? createTemporalContext(temporal) : undefined;

export interface EntityInput {
  readonly id: string | EntityId;
  readonly type: string | EntityType;
  readonly externalIds?: Readonly<Record<string, string>>;
  readonly temporal?: TemporalContext;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createEntity = (input: EntityInput): Entity => {
  const id = entityId(requiredText(input.id, "Entity ID"));
  const type = entityType(input.type);
  const identity = createIdentity(id, input.externalIds);

  return deepFreeze({
    id,
    type,
    identity,
    temporal: freezeTemporal(input.temporal),
    properties: freezeProperties(input.properties ?? {}),
  }) as Entity;
};

export interface RelationshipInput {
  readonly id: string | RelationshipId;
  readonly subject: string | EntityId;
  readonly predicate: string | RelationshipType;
  readonly object: string | EntityId;
  readonly temporal?: TemporalContext;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createRelationship = (input: RelationshipInput): Relationship =>
  deepFreeze({
    id: relationshipId(requiredText(input.id, "Relationship ID")),
    subject: entityId(requiredText(input.subject, "Relationship subject")),
    predicate: relationshipType(input.predicate),
    object: entityId(requiredText(input.object, "Relationship object")),
    temporal: freezeTemporal(input.temporal),
    properties: freezeProperties(input.properties ?? {}),
  }) as Relationship;

export interface AssertionInput {
  readonly id: string | AssertionId;
  readonly subject: string | EntityId;
  readonly predicate: string | RelationshipType;
  readonly object: string | EntityId;
  readonly temporal?: TemporalContext;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export const createAssertion = (input: AssertionInput): Assertion =>
  deepFreeze({
    id: assertionId(requiredText(input.id, "Assertion ID")),
    subject: entityId(requiredText(input.subject, "Assertion subject")),
    predicate: relationshipType(input.predicate),
    object: entityId(requiredText(input.object, "Assertion object")),
    temporal: freezeTemporal(input.temporal),
    properties: freezeProperties(input.properties ?? {}),
  }) as Assertion;
