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
    const makeGate = () => {
      let resolve!: (value: unknown) => void;
      const promise = new Promise((res) => { resolve = res; });
      return { promise, resolve };
    };
    const gates = {
      source: makeGate(),
      entity1: makeGate(), entity2: makeGate(),
      assertion1: makeGate(), assertion2: makeGate(),
      relationship1: makeGate(), relationship2: makeGate(),
      evidence1: makeGate(), evidence2: makeGate(),
      provenance1: makeGate(), provenance2: makeGate(),
    };
    const query = {
      sources: { getById: vi.fn(() => gates.source.promise as never) },
      entities: { getById: vi.fn((id: string) => (id === "entity-1" ? gates.entity1.promise : gates.entity2.promise) as never) },
      assertions: { getById: vi.fn((id: string) => (id === "assertion-1" ? gates.assertion1.promise : gates.assertion2.promise) as never) },
      relationships: { getById: vi.fn((id: string) => (id === "relationship-1" ? gates.relationship1.promise : gates.relationship2.promise) as never) },
      evidence: { getById: vi.fn((id: string) => (id === "evidence-1" ? gates.evidence1.promise : gates.evidence2.promise) as never) },
      provenance: { getById: vi.fn((id: string) => (id === "provenance-1" ? gates.provenance1.promise : gates.provenance2.promise) as never) },
    };
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const execution = workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);

    await vi.waitFor(() => {
      expect(query.entities.getById).toHaveBeenCalledWith("entity-1");
      expect(query.entities.getById).toHaveBeenCalledWith("entity-2");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-1");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-2");
    });

    result.entities.reverse();
    result.assertions.reverse();
    result.relationships.reverse();
    result.evidence.reverse();
    result.provenance.reverse();
    result.entities.push({ id: "entity-extra" } as never);
    result.assertions.push({ id: "assertion-extra" } as never);

    gates.source.resolve(result.source);
    gates.entity1.resolve({ id: "entity-1" }); gates.entity2.resolve({ id: "entity-2" });
    gates.assertion1.resolve({ id: "assertion-1" }); gates.assertion2.resolve({ id: "assertion-2" });
    gates.relationship1.resolve({ id: "relationship-1" }); gates.relationship2.resolve({ id: "relationship-2" });
    gates.evidence1.resolve({ id: "evidence-1" }); gates.evidence2.resolve({ id: "evidence-2" });
    gates.provenance1.resolve({ id: "provenance-1" }); gates.provenance2.resolve({ id: "provenance-2" });

    const output = await execution;
    expect(output.readBack.entities.map((value) => value.id)).toEqual(["entity-1", "entity-2"]);
    expect(output.readBack.assertions.map((value) => value.id)).toEqual(["assertion-1", "assertion-2"]);
    expect(query.entities.getById).toHaveBeenCalledTimes(2);
    expect(query.assertions.getById).toHaveBeenCalledTimes(2);
  });
});
