import { describe, expect, it } from "vitest";
import { createMemoryUnitOfWork } from "@project-index/storage";
import { IngestionService, ValidationError } from "./index";

describe("IngestionService", () => {
  it("persists a complete batch atomically and preserves provenance in the result", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const service = new IngestionService(unitOfWork);

    const result = await service.ingest({
      source: { id: "source-1", kind: "repository", uri: "file:///repo" },
      entities: [
        { id: "entity-1", type: "package" },
        { id: "entity-2", type: "package" },
      ],
      assertions: [
        { id: "assertion-1", subject: "entity-1", predicate: "dependsOn", object: "entity-2" },
      ],
      relationships: [
        { id: "relationship-1", subject: "entity-1", predicate: "dependsOn", object: "entity-2" },
      ],
      evidence: [
        { id: "evidence-1", sourceId: "source-1", assertionId: "assertion-1", excerpt: "dependsOn" },
      ],
      provenance: [
        { id: "provenance-1", role: "assertion", assertionId: "assertion-1" },
      ],
    });

    expect(result.source.id).toBe("source-1");
    expect(result.entities).toHaveLength(2);
    expect(result.assertions).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);
    expect(result.evidence).toHaveLength(1);
    expect(result.provenance).toHaveLength(1);
    expect(await unitOfWork.assertions.getById(result.assertions[0]!.id)).toEqual(result.assertions[0]);
    expect(await unitOfWork.evidence.getById(result.evidence[0]!.id)).toEqual(result.evidence[0]);
  });

  it("rolls back the batch when referential validation fails", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const service = new IngestionService(unitOfWork);

    await expect(service.ingest({
      source: { id: "source-2", kind: "repository" },
      assertions: [
        { id: "assertion-2", subject: "missing", predicate: "dependsOn", object: "missing-2" },
      ],
    })).rejects.toBeInstanceOf(ValidationError);

    expect(await unitOfWork.sources.getById("source-2" as never)).toBeNull();
    expect(await unitOfWork.assertions.getById("assertion-2" as never)).toBeNull();
  });
});
