import { describe, expect, it, vi } from "vitest";
import { createMemoryUnitOfWork, createQueryService, createQueryTraversalService, createQueryEvidenceTraversalService, createUnifiedQueryService } from "@project-index/storage";
import { ValidatedWriter } from "@project-index/validation";
import { createApplicationServices } from "./application";

describe("Phase 2.8.10 application ingestion workflow", () => {
  const createPersistence = () => {
    const unitOfWork = createMemoryUnitOfWork();
    const query = createUnifiedQueryService(
      createQueryService(unitOfWork),
      createQueryTraversalService({ entities: [], assertions: [], relationships: [] }),
      createQueryEvidenceTraversalService({ sources: [], evidence: [], derivations: [], provenance: [] }),
    );

    return {
      unitOfWork,
      persistence: {
        query,
        createWriter: vi.fn().mockResolvedValue(new ValidatedWriter({ unitOfWork })),
        close: vi.fn(),
      },
    };
  };

  it("validates and persists a heterogeneous batch, then reads it back through the application query boundary", async () => {
    const { persistence } = createPersistence();
    const application = createApplicationServices(persistence as never);

    const result = await application.ingestion.ingest({
      source: { id: "source-app-1", kind: "repository", uri: "file:///repo" },
      entities: [
        { id: "entity-app-1", type: "package" },
        { id: "entity-app-2", type: "package" },
      ],
      assertions: [
        { id: "assertion-app-1", subject: "entity-app-1", predicate: "dependsOn", object: "entity-app-2" },
      ],
      relationships: [
        { id: "relationship-app-1", subject: "entity-app-1", predicate: "dependsOn", object: "entity-app-2" },
      ],
      evidence: [
        { id: "evidence-app-1", sourceId: "source-app-1", assertionId: "assertion-app-1", excerpt: "dependsOn" },
      ],
    });

    expect(result.source.id).toBe("source-app-1");
    expect(result.entities).toHaveLength(2);
    expect(result.assertions).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);
    expect(result.evidence).toHaveLength(1);

    await expect(application.query.entities.getById(result.entities[0]!.id)).resolves.toEqual(result.entities[0]);
    await expect(application.query.assertions.getById(result.assertions[0]!.id)).resolves.toEqual(result.assertions[0]);
    await expect(application.query.relationships.getById(result.relationships[0]!.id)).resolves.toEqual(result.relationships[0]);
    await expect(application.query.evidence.getById(result.evidence[0]!.id)).resolves.toEqual(result.evidence[0]);

    expect(application.ingestion).not.toHaveProperty("writer");
    expect(application.ingestion).not.toHaveProperty("unitOfWork");
    expect(application.ingestion).not.toHaveProperty("storage");
  });

  it("maps failed ingestion validation to ApplicationError and preserves atomicity", async () => {
    const { persistence, unitOfWork } = createPersistence();
    const application = createApplicationServices(persistence as never);

    await expect(application.ingestion.ingest({
      source: { id: "source-app-2", kind: "repository" },
      assertions: [
        { id: "assertion-app-2", subject: "missing", predicate: "dependsOn", object: "missing-2" },
      ],
    })).rejects.toMatchObject({
      name: "ApplicationError",
      code: "STORAGE_ERROR",
    });

    await expect(application.query.sources.getById("source-app-2" as never)).resolves.toBeNull();
    await expect(application.query.assertions.getById("assertion-app-2" as never)).resolves.toBeNull();
    expect(persistence.createWriter).toHaveBeenCalledTimes(1);
    expect(unitOfWork).not.toHaveProperty("saveMany");
  });
});
