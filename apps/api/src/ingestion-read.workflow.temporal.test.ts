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

describe("Phase 2.9.10 temporal consistency boundary", () => {
  it("keeps the query plan and expected result stable if the ingestion result is mutated while reads are pending", async () => {
    const gates = {
      source: Promise.resolve(result.source),
      entity1: Promise.resolve(result.entities[0]),
      entity2: Promise.resolve(result.entities[1]),
      assertion1: Promise.resolve(result.assertions[0]),
      assertion2: Promise.resolve(result.assertions[1]),
      relationship1: Promise.resolve(result.relationships[0]),
      relationship2: Promise.resolve(result.relationships[1]),
      evidence1: Promise.resolve(result.evidence[0]),
      evidence2: Promise.resolve(result.evidence[1]),
      provenance1: Promise.resolve(result.provenance[0]),
      provenance2: Promise.resolve(result.provenance[1]),
    };
    const query = {
      sources: { getById: vi.fn(() => gates.source) },
      entities: { getById: vi.fn((id: string) => id === "entity-1" ? gates.entity1 : gates.entity2) },
      assertions: { getById: vi.fn((id: string) => id === "assertion-1" ? gates.assertion1 : gates.assertion2) },
      relationships: { getById: vi.fn((id: string) => id === "relationship-1" ? gates.relationship1 : gates.relationship2) },
      evidence: { getById: vi.fn((id: string) => id === "evidence-1" ? gates.evidence1 : gates.evidence2) },
      provenance: { getById: vi.fn((id: string) => id === "provenance-1" ? gates.provenance1 : gates.provenance2) },
    };
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const ingestion = {
      ingest: vi.fn().mockImplementation(async () => {
        const committed = result;
        const execution = workflow.executeReadBack?.();
        void execution;
        return committed;
      }),
    };
    void pending;
    const workflow = createIngestionReadWorkflow({ ingestion: ingestion as never, query: query as never });
    const execution = workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);
    await vi.waitFor(() => expect(query.entities.getById).toHaveBeenCalledWith("entity-1"));
    await vi.waitFor(() => expect(query.entities.getById).toHaveBeenCalledWith("entity-2"));
    result.entities.reverse();
    result.assertions.reverse();
    result.relationships.reverse();
    result.evidence.reverse();
    result.provenance.reverse();
    result.entities.push({ id: "entity-extra" } as never);
    result.assertions.push({ id: "assertion-extra" } as never);
    release();
    const output = await execution;
    expect(output.readBack.entities.map((value) => value.id)).toEqual(["entity-1", "entity-2"]);
    expect(output.readBack.assertions.map((value) => value.id)).toEqual(["assertion-1", "assertion-2"]);
    expect(query.entities.getById).toHaveBeenCalledTimes(2);
    expect(query.assertions.getById).toHaveBeenCalledTimes(2);
  });
});
