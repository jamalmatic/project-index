# Phase 1 — Step 3: Evidence & Provenance

Step 3 introduces the first implementation of the evidence layer described by the Project Index semantic specification.

## Implemented

- `SourceId`
- `EvidenceId`
- `Source`
- `Evidence`
- `EvidenceLocator`
- `createSource()`
- `createEvidence()`

## Current invariants

- source and evidence identifiers cannot be empty;
- source kinds are explicitly constrained;
- Evidence must reference an Entity or Assertion;
- line-based Evidence locators must have valid ranges;
- domain objects are deeply immutable;
- Entity and Assertion references use the branded identifiers from `@project-index/core`.

## Architectural boundary

The evidence package depends on core primitives but does not depend on persistence, API, UI, or inference. Evidence records support later provenance and derivation work without coupling the semantic model to a storage implementation.

## Not yet implemented

This step intentionally does not yet implement:

- source retrieval;
- document parsing;
- content hashing;
- evidence extraction;
- provenance graphs;
- derivation records;
- evidence quality scoring;
- persistence.

Those belong to later vertical slices and should be driven by concrete ingestion requirements.
