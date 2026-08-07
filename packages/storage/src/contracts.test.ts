import { describe, expect, it } from "vitest";
import { createAssertion, createEntity, createRelationship } from "@project-index/domain";
import { createEvidence, createSource } from "@project-index/evidence";
import type { Evidence, Source } from "@project-index/evidence";
import type { AssertionRepository, EntityRepository, EvidenceRepository, RelationshipRepository, SourceRepository } from "./repository";
import { MemoryAssertionRepository, MemoryEntityRepository, MemoryEvidenceRepository, MemoryRelationshipRepository, MemorySourceRepository } from "./memory";

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
      expect(await testCase.get(repository, testCase.value.id)).toBe(testCase.value);
    });

    it("replaces a record with the same identity", async () => {
      const repository = testCase.create();
      await testCase.save(repository, testCase.value);
      await testCase.save(repository, testCase.value);
      expect(await testCase.get(repository, testCase.value.id)).toBe(testCase.value);
    });
  });
};

const entity = createEntity({ id: "entity:test", type: "person", identity: { canonical: "entity:test" } });
const assertion = createAssertion({ id: "assertion:test", subject: entity.id, predicate: "name", object: "Project Index" });
const relationship = createRelationship({ id: "relationship:test", type: "related_to", subject: entity.id, object: entity.id });
const source = createSource({ id: "source:test", kind: "document" });
const evidence = createEvidence({ id: "evidence:test", sourceId: source.id, assertionId: assertion.id });

runContract({ name: "EntityRepository", create: () => new MemoryEntityRepository(), get: (r, id) => r.getById(id as never), save: (r, v) => r.save(v), value: entity });
runContract({ name: "AssertionRepository", create: () => new MemoryAssertionRepository(), get: (r, id) => r.getById(id as never), save: (r, v) => r.save(v), value: assertion });
runContract({ name: "RelationshipRepository", create: () => new MemoryRelationshipRepository(), get: (r, id) => r.getById(id as never), save: (r, v) => r.save(v), value: relationship });
runContract<Source, SourceRepository>({ name: "SourceRepository", create: () => new MemorySourceRepository(), get: (r, id) => r.getById(id as never), save: (r, v) => r.save(v), value: source });
runContract<Evidence, EvidenceRepository>({ name: "EvidenceRepository", create: () => new MemoryEvidenceRepository(), get: (r, id) => r.getById(id as never), save: (r, v) => r.save(v), value: evidence });

void ({} as AssertionRepository);
void ({} as EntityRepository);
