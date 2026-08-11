import { describe, expect, it } from "vitest";
import { assertionId, entityId } from "@project-index/core";
import { createDerivation, createEvidence, createProvenanceRecord, createSource, sourceId } from "@project-index/evidence";
import { createQueryEvidenceTraversalService } from "./evidence-traversal";

describe("Phase 2.6 evidence, provenance and derivation traversal", () => {
  it("traverses evidence from source, assertion and entity", async () => {
    const source = createSource({ id: "source-2.6", kind: "repository" });
    const evidence = createEvidence({
      id: "evidence-2.6",
      sourceId: source.id,
      assertionId: assertionId("assertion-2.6"),
      entityId: entityId("entity-2.6"),
    });
    const query = createQueryEvidenceTraversalService({
      sources: [source], evidence: [evidence], derivations: [], provenance: [],
    });

    await expect(query.evidence.findBySource(source.id)).resolves.toEqual([evidence]);
    await expect(query.evidence.findByAssertion(assertionId("assertion-2.6"))).resolves.toEqual([evidence]);
    await expect(query.evidence.findByEntity(entityId("entity-2.6"))).resolves.toEqual([evidence]);
  });

  it("traverses derivation lineage deterministically", async () => {
    const derivation = createDerivation({
      id: "derivation-2.6",
      outputAssertionId: assertionId("assertion-out"),
      inputAssertionIds: [assertionId("assertion-in")],
      ruleId: "rule-2.6",
    });
    const query = createQueryEvidenceTraversalService({
      sources: [], evidence: [], derivations: [derivation], provenance: [],
    });

    await expect(query.derivations.findByOutputAssertion(assertionId("assertion-out"))).resolves.toEqual([derivation]);
    await expect(query.derivations.findByInputAssertion(assertionId("assertion-in"))).resolves.toEqual([derivation]);
    await expect(query.derivations.findByRule("rule-2.6")).resolves.toEqual([derivation]);
  });

  it("traverses provenance by its typed subject reference", async () => {
    const provenance = createProvenanceRecord({
      id: "provenance-2.6",
      subject: { role: "assertion", assertionId: assertionId("assertion-2.6") },
    });
    const query = createQueryEvidenceTraversalService({
      sources: [], evidence: [], derivations: [], provenance: [provenance],
    });

    await expect(query.provenance.findBySubjectId(assertionId("assertion-2.6"))).resolves.toEqual([provenance]);
    await expect(query.provenance.findBySubjectId(assertionId("missing"))).resolves.toEqual([]);
  });

  it("orders results by canonical id", async () => {
    const first = createSource({ id: sourceId("source-a"), kind: "document" });
    const second = createSource({ id: sourceId("source-b"), kind: "document" });
    const query = createQueryEvidenceTraversalService({
      sources: [second, first], evidence: [], derivations: [], provenance: [],
    });

    await expect(query.sources.findByKind("document")).resolves.toEqual([first, second]);
  });
});
