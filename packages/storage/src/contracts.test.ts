import { describe, expect, it } from "vitest";
import { assertionId, entityId, relationshipId } from "@project-index/core";
import { createAssertion, createEntity, createRelationship } from "@project-index/domain";
import { createEvidence, createSource } from "@project-index/evidence";
import type { AssertionRepository, EntityRepository, EvidenceRepository, RelationshipRepository, SourceRepository } from "./repository";
import {
  MemoryAssertionRepository,
  MemoryEntityRepository,
  MemoryEvidenceRepository,
  MemoryRelationshipRepository,
  MemorySourceRepository,
} from "./memory";

interface RepositoryCase<T extends { readonly id: string }, R> {
  name: string;
  create: () => R;
  get: (repository: R, id: T["id"]) => Promise<T | null>;
  save: (repository: R, value: T) => Promise<void>;
  value: T;
}

const runContract = <T extends { readonly id: string }, R>(testCase: RepositoryCase<T, R>) => {
  describe(testCase.name, () => {
    it("returns null for a missing record", async () => {
      const repository = testCase.create();
      expect(await testCase.get(repository, "missing" as T["id"])).toBeNull();
    });

    it("saves and retrieves by stable identity", async () => {
      const repository = testCase.create();
      await testCase.save(repository, testCase.value);
      const result = await testCase.get(repository, testCase.value.id);
      expect(result).toBe(testCase.value);
    });

    it("replaces a record with the same identity", async () => {
      const repository = testCase.create();
      await testCase.save(repository, testCase.value);
      await testCase.save(repository, testCase.value);
      expect(await testCase.get(repository, testCase.value.id)).toBe(testCase.value);
    });
  });
};

const entity = createEntity({
  id: "entity:test",
  type: "person",
  identity: { canonical: "entity:test" },
});
const assertion = createAssertion({
  id: "assertion:test",
  subject: entity.id,
  predicate: "name",
  object: "Project Index",
});
const relationship = createRelationship({
  id: "relationship:test",
  type: "related_to",
  subject: entity.id,
  object: entity.id,
});
const source = createSource({ id: "source:test", kind: "document" });
const evidence = createEvidence({
  id: "evidence:test",
  sourceId: source.id,
  assertionId: assertion.id,
});

runContract<Entity, EntityRepository>({
  name: "EntityRepository",
  create: () => new MemoryEntityRepository(),
  get: (repository, id) => repository.getById(id as never),
  save: (repository, value) => repository.save(value),
  value: entity,
});
runContract<Assertion, AssertionRepository>({
  name: "AssertionRepository",
  create: () => new MemoryAssertionRepository(),
  get: (repository, id) => repository.getById(id as never),
  save: (repository, value) => repository.save(value),
  value: assertion,
});
runContract<Relationship, RelationshipRepository>({
  name: "RelationshipRepository",
  create: () => new MemoryRelationshipRepository(),
  get: (repository, id) => repository.getById(id as never),
  save: (repository, value) => repository.save(value),
  value: relationship,
});
runContract<Source, SourceRepository>({
  name: "SourceRepository",
  create: () => new MemorySourceRepository(),
  get: (repository, id) => repository.getById(id as never),
  save: (repository, value) => repository.save(value),
  value: source,
});
runContract<Evidence, EvidenceRepository>({
  name: "EvidenceRepository",
  create: () => new MemoryEvidenceRepository(),
  get: (repository, id) => repository.getById(id as never),
  save: (repository, value) => repository.save(value),
  value: evidence,
});

void entityId;
void assertionId;
void relationshipId;
