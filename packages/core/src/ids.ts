export type Brand<T, B extends string> = T & { readonly __brand: B };

export type EntityId = Brand<string, "EntityId">;
export type AssertionId = Brand<string, "AssertionId">;
export type RelationshipId = Brand<string, "RelationshipId">;

const createId = <T extends string>(value: string, kind: string): T => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${kind} must not be empty`);
  return normalized as T;
};

export const entityId = (value: string): EntityId => createId<EntityId>(value, "Entity ID");
export const assertionId = (value: string): AssertionId => createId<AssertionId>(value, "Assertion ID");
export const relationshipId = (value: string): RelationshipId =>
  createId<RelationshipId>(value, "Relationship ID");
