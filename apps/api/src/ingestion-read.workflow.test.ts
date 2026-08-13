  it("starts all independent read-back branches before any branch resolves", async () => {
    const ingestion = { ingest: vi.fn().mockResolvedValue(result) };
    const query = makeQuery();
    function makeGate() {
      let resolve!: (value: unknown) => void;
      const promise = new Promise((res) => {
        resolve = res;
      });
      return { promise, resolve };
    }
    type Gate = ReturnType<typeof makeGate>;
    const gates: [Gate, Gate, Gate, Gate, Gate, Gate] = [
      makeGate(),
      makeGate(),
      makeGate(),
      makeGate(),
      makeGate(),
      makeGate(),
    ];
    const [sourceGate, entityGate, assertionGate, relationshipGate, evidenceGate, provenanceGate] = gates;

    query.sources.getById.mockReturnValue(sourceGate.promise);
    query.entities.getById.mockReturnValue(entityGate.promise);
    query.assertions.getById.mockReturnValue(assertionGate.promise);
    query.relationships.getById.mockReturnValue(relationshipGate.promise);
    query.evidence.getById.mockReturnValue(evidenceGate.promise);
    query.provenance.getById.mockReturnValue(provenanceGate.promise);

    const workflow = createIngestionReadWorkflow({ ingestion, query: query as never });
    const execution = workflow.execute({ source: { id: "source-1", kind: "repository" } } as never);

    await vi.waitFor(() => {
      expect(query.sources.getById).toHaveBeenCalledWith("source-1");
      expect(query.entities.getById).toHaveBeenCalledWith("entity-1");
      expect(query.assertions.getById).toHaveBeenCalledWith("assertion-1");
      expect(query.relationships.getById).toHaveBeenCalledWith("relationship-1");
      expect(query.evidence.getById).toHaveBeenCalledWith("evidence-1");
      expect(query.provenance.getById).toHaveBeenCalledWith("provenance-1");
    });

    sourceGate.resolve(result.source);
    entityGate.resolve(result.entities[0]);
    assertionGate.resolve(result.assertions[0]);
    relationshipGate.resolve(result.relationships[0]);
    evidenceGate.resolve(result.evidence[0]);
    provenanceGate.resolve(result.provenance[0]);

    await expect(execution).resolves.toBeDefined();
  });
