import { assertionId } from "@project-index/core";
import { sourceId } from "@project-index/evidence";
import { describe, expect, it, vi } from "vitest";
import { createMemoryUnitOfWork } from "@project-index/storage";
import { IngestionService, ValidationError, ValidatedWriter } from "./index";

describe("IngestionService", () => {
  const createWriter = () => new ValidatedWriter({ unitOfWork: createMemoryUnitOfWork() });

  it("persists a complete batch atomically and preserves provenance in the result", async () => {
    const unitOfWork = createMemoryUnitOfWork();
    const service = new IngestionService(async () => new ValidatedWriter({ unitOfWork }));

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
        { id: "provenance-1", subject: { role: "assertion", assertionId: assertionId("assertion-1") } },
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
    const service = new IngestionService(async () => new ValidatedWriter({ unitOfWork }));

    await expect(service.ingest({
      source: { id: "source-2", kind: "repository" },
      assertions: [
        { id: "assertion-2", subject: "missing", predicate: "dependsOn", object: "missing-2" },
      ],
    })).rejects.toBeInstanceOf(ValidationError);

    expect(await unitOfWork.sources.getById(sourceId("source-2"))).toBeNull();
    expect(await unitOfWork.assertions.getById(assertionId("assertion-2"))).toBeNull();
  });

  it("accepts a writer factory and does not construct the writer until ingest", async () => {
    const writer = createWriter();
    const createWriterMock = vi.fn().mockResolvedValue(writer);
    const service = new IngestionService(createWriterMock);

    expect(createWriterMock).not.toHaveBeenCalled();
    await service.ingest({ source: { id: "source-3", kind: "repository" } });
    expect(createWriterMock).toHaveBeenCalledTimes(1);
  });
});
