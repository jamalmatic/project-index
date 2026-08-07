export type Brand<T, B extends string> = T & { readonly __brand: B };

export type EntityId = Brand<string, "EntityId">;
export type AssertionId = Brand<string, "AssertionId">;
export type RelationshipId = Brand<string, "RelationshipId">;

export const entityId = (value: string): EntityId => value as EntityId;
export const assertionId = (value: string): AssertionId => value as AssertionId;
export const relationshipId = (value: string): RelationshipId => value as RelationshipId;
