import { describe, expect, it } from "vitest";
import { createQueryService } from "./query";
import { createQueryTraversalService } from "./traversal";
import { createQueryEvidenceTraversalService } from "./evidence-traversal";
import { createUnifiedQueryService } from "./unified-query";

const emptyQuery = () => createQueryService({
  entities: { getById: async () => null },
  assertions: { getById: async () => null },
  relationships: { getById: async () => null },
  sources: { getById: async () => null },
  evidence: { getById: async () => null },
  derivations: { getById: async () => null },
  provenance: { getById: async () => null },
});

describe("Phase 2.6.6 unified query service", () => {
  it("combines identity and traversal reads into one boundary", async () => {
    const query = createUnifiedQueryService(
      emptyQuery(),
      createQueryTraversalService({ entities: [], assertions: [], relationships: [] }),
      createQueryEvidenceTraversalService({ sources: [], evidence: [], derivations: [], provenance: [] }),
    );

    await expect(query.entities.getById("missing" as never)).resolves.toBeNull();
    await expect(query.entities.findByType("person")).resolves.toEqual([]);
    await expect(query.assertions.findByPredicate("isA")).resolves.toEqual([]);
    await expect(query.evidence.findBySource("missing" as never)).resolves.toEqual([]);
    await expect(query.derivations.findByRule("missing")).resolves.toEqual([]);
    await expect(query.provenance.findBySubjectId("missing" as never)).resolves.toEqual([]);
  });

  it("does not expose mutation or transaction methods", () => {
    const query = createUnifiedQueryService(
      emptyQuery(),
      createQueryTraversalService({ entities: [], assertions: [], relationships: [] }),
      createQueryEvidenceTraversalService({ sources: [], evidence: [], derivations: [], provenance: [] }),
    );

    expect(query).not.toHaveProperty("commit");
    expect(query).not.toHaveProperty("rollback");
    expect(query.entities).not.toHaveProperty("save");
    expect(query.assertions).not.toHaveProperty("save");
    expect(query.relationships).not.toHaveProperty("save");
    expect(query.sources).not.toHaveProperty("save");
    expect(query.evidence).not.toHaveProperty("save");
    expect(query.derivations).not.toHaveProperty("save");
    expect(query.provenance).not.toHaveProperty("save");
  });
});
