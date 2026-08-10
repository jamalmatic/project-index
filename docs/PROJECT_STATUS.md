# Project Index — Source of Truth

> This document is the authoritative implementation-status record for the repository. Update it whenever a foundation step, architectural contract, or phase boundary changes.

## Current state

**Phase 1 — Foundation: COMPLETE / LOCKED**  
**Phase 2.1 — Ingestion Contract: COMPLETE / LOCKED**  
**Phase 2.2 — Discovery Primitives: IN PROGRESS**

Phase 1 is locked as the completed foundation baseline. Phase 2.1 is locked after implementation, regression testing, and CI acceptance. Phase 2.2 is the current active capability-layer workstream.

## Phase 1 — Foundation

| Step | Area | Implementation status | Notes |
|---:|---|---|---|
| 1 | Repository structure | Complete | TypeScript monorepo with `apps/` and modular `packages/`. |
| 2 | Core domain model | Complete | Foundational primitives and shared domain infrastructure. |
| 3 | IDs and canonical identity | Complete | Branded IDs and canonical identity semantics are established. |
| 4 | Entity model | Complete | Immutable entity model with identity, type, temporal state, and properties. |
| 5 | Assertion model | Complete | Immutable subject/predicate/object assertion model. |
| 6 | Relationship model | Complete | Immutable relationship model distinct from assertions. |
| 7 | Evidence model | Complete | Sources/evidence with locators and evidence metadata. |
| 8 | Provenance model | Complete | Provenance references and derivations with validation and immutability. |
| 9 | Validation model | Complete | Validation issues/results, rules, orchestration, referential/consistency/temporal validation, and validated writing. |
| 10 | Persistence layer | Complete | Repository contracts, transactional unit of work, in-memory behavior, and PostgreSQL adapter. |
| 11 | Basic migrations | Complete | Initial PostgreSQL schema migration for persisted domain records. |
| 12 | Test infrastructure | Complete | Shared deterministic fixtures and immutable-record test helpers. |

## Phase 2 — Capability Layer

### Step 2.1 — Ingestion Contract — COMPLETE / LOCKED

The contract is documented in `docs/02-phase-2/2.1-INGESTION-CONTRACT.md`. The implementation is in the validation package and is covered by unit, integration, transaction, and ingestion tests accepted by CI.

The implemented flow is:

```text
normalized input
  → canonical domain construction
  → evidence + provenance construction
  → complete-batch validation
  → staged-reference validation
  → atomic persistence
  → single commit
```

The implementation guarantees that a multi-object batch is validated before repository mutation, references may resolve against objects staged earlier in the same batch, validation failure performs no commit, and persistence failure rolls the unit of work back. The ingestion result preserves constructed provenance metadata.

Phase 2.1 intentionally does not claim independent provenance persistence because the current `UnitOfWork` persistence contract has no provenance repository.

### Step 2.2 — Discovery Primitives — IN PROGRESS

The contract is documented in `docs/02-phase-2/2.2-DISCOVERY-PRIMITIVES.md`.

Implemented so far:

- canonical discovery resource IDs;
- immutable resource records;
- explicit resource kinds;
- immutable discovery evidence records;
- provider abstraction;
- deterministic URI ordering;
- unit tests for these primitives.

Remaining acceptance work:

- detection-rule contract;
- structured rule execution results;
- discovery orchestration that feeds Phase 2.1;
- read-only integration tests proving discovery does not mutate knowledge persistence;
- CI acceptance and phase lock.

Discovery evidence intentionally remains distinct from domain `Evidence` until a discovery finding has a canonical entity/assertion target. This avoids falsely representing an observed file/resource as domain knowledge.

## Implemented package responsibilities

```text
apps/
  api/         Application/API boundary
  web/         Consumer interface boundary

packages/
  core/        IDs, canonical primitives, temporal/context primitives
  domain/      Entity, assertion, relationship domain models
  ontology/    Entity/relationship constraints
  evidence/    Source, evidence, provenance and derivation models
  inference/  Derivation/inference capabilities
  validation/ Validation contracts, rules, orchestration, validated writes and discovery primitives
  storage/    Repository/unit-of-work contracts, memory and PostgreSQL persistence
  testing/    Shared test fixtures and assertions
```

## Important architectural contracts

### Immutability

Domain records and validation/provenance/discovery records are constructed as immutable values. Builders/factories normalize input and return deeply frozen records where the model requires it.

### Branded identity

IDs are nominal/branded TypeScript values. Cross-entity IDs are intentionally not interchangeable; this prevents assertions, relationships, entities, evidence, etc. from being accidentally mixed at compile time.

### Optional properties

The repository uses `exactOptionalPropertyTypes`. Implementations must omit absent optional fields rather than constructing properties whose value is explicitly `undefined`.

### Validation

Validation is modeled as a domain capability rather than an ad-hoc collection of checks. Validation produces structured issues and results and supports referential, consistency, temporal, and orchestrated validation.

### Persistence

Persistence is behind repository and `UnitOfWork` contracts. The in-memory implementation is the reference behavioral implementation for transaction semantics; PostgreSQL is the database adapter.

### Ingestion atomicity

The validated writer treats multi-object ingestion as a transaction boundary. All operations are prepared and validated before any repository save. Same-batch references resolve against staged objects, and only a fully valid batch reaches persistence and a single commit.

### Discovery read-only boundary

Discovery observes resources and produces immutable observations. It does not persist discovered resources or mutate the inspected project. Domain knowledge creation remains the responsibility of the Phase 2.1 ingestion boundary.

## Documentation source of truth

The repository distinguishes implementation truth from the early design corpus.

- `docs/README.md` — documentation hierarchy and authority rules.
- `docs/00-source-of-truth/DOCUMENTATION_INDEX.md` — organization of the corpus.
- `docs/00-source-of-truth/CORPUS_MANIFEST.md` — inventory of all 84 original documents.
- `docs/00-source-of-truth/IMPLEMENTATION_MATRIX.md` — design-to-code reconciliation.
- `docs/00-source-of-truth/RECONCILIATION_NOTES.md` — decisions made while reconciling the corpus.
- `docs/ROADMAP.md` — approved next-phase sequence.
- `docs/02-phase-2/2.1-INGESTION-CONTRACT.md` — locked Phase 2.1 contract.
- `docs/02-phase-2/2.2-DISCOVERY-PRIMITIVES.md` — active Phase 2.2 contract.

Documents 73–84 are treated as the strongest semantic specification set, but their capabilities are not considered implemented unless this status document and the implementation matrix say so.

## Verification state

Phase 1 completion was accepted with CI green. Phase 2.1 implementation, regression tests, and CI are green and the step is locked. Phase 2.2 primitives have been implemented and tested locally; final CI acceptance is still pending.

## What is deliberately NOT claimed yet

- Phase 2.2 completion.
- Detection-rule and analyzer contracts.
- Independent provenance persistence through `UnitOfWork`.
- Production-grade database migration orchestration beyond the initial migration foundation.
- A complete public API/application surface.
- Full inference engine behavior.
- Complete ontology authoring and constraint management.
- Production web UX.
- Full conflict-resolution workflows.
- Performance/scaling guarantees.

These remain future work and must not be described as implemented functionality.
