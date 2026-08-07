import { describe, expect, it } from "vitest";
import { createAssertion, createEntity, createRelationship } from "@project-index/domain";
import { createEvidence, createSource } from "@project-index/evidence";
import { createMemoryUnitOfWork } from "@project-index/storage";
import {
  validateAssertionReferences,
  validateEvidenceReferences,
  validateRelationshipReferences,
} from "./referential";

describe("referential validation", () => {
  it("accepts an assertion whose subject and object exist", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const subject = createEntity({ id: "entity:subject", type: "person" });
    const object = createEntity({ id: "entity:object", type: "person" });
    await unitOfWork.entities.save(subject);
    await unitOfWork.entities.save(object);

    const assertion = createAssertion({
      id: "assertion:1",
      subject: subject.id,
      predicate: "knows",
      object: object.id,
    });

    const result = await validateAssertionReferences(assertion, unitOfWork);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("reports missing assertion references", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const assertion = createAssertion({
      id: "assertion:1",
      subject: "entity:missing-subject",
      predicate: "knows",
      object: "entity:missing-object",
    });

    const result = await validateAssertionReferences(assertion, unitOfWork);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual([
      "assertion:1.subject",
      "assertion:1.object",
    ]);
  });

  it("reports missing relationship references", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const relationship = createRelationship({
      id: "relationship:1",
      subject: "entity:missing-subject",
      predicate: "knows",
      object: "entity:missing-object",
    });

    const result = await validateRelationshipReferences(relationship, unitOfWork);
    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(2);
  });

  it("validates evidence source and optional assertion/entity references", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const source = createSource({ id: "source:1", kind: "document" });
    const entity = createEntity({ id: "entity:1", type: "person" });
    const assertion = createAssertion({
      id: "assertion:1",
      subject: entity.id,
      predicate: "knows",
      object: entity.id,
    });
    await unitOfWork.sources.save(source);
    await unitOfWork.entities.save(entity);
    await unitOfWork.assertions.save(assertion);

    const evidence = createEvidence({
      id: "evidence:1",
      sourceId: source.id,
      assertionId: assertion.id,
      entityId: entity.id,
    });

    const result = await validateEvidenceReferences(evidence, unitOfWork);
    expect(result.valid).toBe(true);
  });

  it("reports missing evidence references independently", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const evidence = createEvidence({
      id: "evidence:1",
      sourceId: "source:missing",
      assertionId: "assertion:missing",
      entityId: "entity:missing",
    });

    const result = await validateEvidenceReferences(evidence, unitOfWork);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.ruleId)).toEqual([
      "evidence.reference.source",
      "evidence.reference.assertion",
      "evidence.reference.entity",
    ]);
  });
});
