import { describe, expect, it, vi } from "vitest";
import type { IngestionResult } from "@project-index/validation";
import { createIngestionReadWorkflow } from "./ingestion-read.workflow";

const result = {
  source: { id: "source-1", kind: "repository" },
  entities: [{ id: "entity-1" }, { id: "entity-2" }],
  assertions: [{ id: "assertion-1" }, { id: "assertion-2" }],
  relationships: [{ id: "relationship-1" }, { id: "relationship-2" }],
  evidence: [{ id: "evidence-1" }, { id: "evidence-2" }],
  provenance: [{ id: "provenance-1" }, { id: "provenance-2" }],
} as unknown as IngestionResult;

describe("Phase 2.9.9 read-back ordering and cardinality", () => {
  const makeQuery = () => ({
    sources: { getById: vi.fn().mockResolvedValue(result.source) },
    entities: { getById: vi.fn((id: string) => result.entities.find((value) => value.id === id)) },
    assertions: { getById: vi.fn((id: string) => result.assertions.find((value) => value.id === id)) },
    relationships: { getById: vi.fn((id: string) => result.relationships.find((value) => value.id === id)) },
    evidence: { getById: vi.fn((id: string) => result.evidence.find((value) => value.id === id)) },
    provenance: { getById: vi.fn((id: string) => result.provenance.find((value) => value.id === id)) },
  });

  it("preserves committed collection order and cardinality during read-back", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const output = await workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    expect(output.readBack.entities.map((value) => value.id)).toEqual(result.entities.map((value) => value.id));
    expect(output.readBack.assertions.map((value) => value.id)).toEqual(result.assertions.map((value) => value.id));
    expect(output.readBack.relationships.map((value) => value.id)).toEqual(result.relationships.map((value) => value.id));
    expect(output.readBack.evidence.map((value) => value.id)).toEqual(result.evidence.map((value) => value.id));
    expect(output.readBack.provenance.map((value) => value.id)).toEqual(result.provenance.map((value) => value.id));
  });

  it("rejects when a committed collection item is missing from read-back", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockImplementation((id: string) => id === "entity-1" ? result.entities[0] : undefined);
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR" });
  });

  it("rejects when a read-back identity is not one of the committed identities", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    query.entities.getById.mockImplementation((id: string) => id === "entity-1" ? result.entities[0] : { id: "entity-extra" });
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    await expect(workflow.execute({ source: { id: "source-1", kind: "repository" } } as never)).rejects.toMatchObject({ name: "ApplicationError", code: "STORAGE_ERROR" });
  });
});
