# Project Index — Source of Truth

> This document is the authoritative implementation-status record for the repository. Update it whenever a foundation step, architectural contract, or phase boundary changes.

## Current state

**Phase 1 — Foundation: COMPLETE / LOCKED**  
**Phase 2.1 — Ingestion Contract: COMPLETE / LOCKED**  
**Phase 2.2 — Discovery Primitives: COMPLETE / LOCKED**  
**Phase 2.3 — Rule and Analyzer Contracts: COMPLETE / LOCKED**  
**Phase 2.4 — Derivation and Inference: COMPLETE / LOCKED**  
**Next: Phase 2.5 — Validation Profiles and Conflict Handling**

Phase 1 is the completed foundation baseline. Phase 2.1, 2.2, 2.3, and 2.4 are locked after implementation, regression testing, deterministic end-to-end testing, typecheck, and CI acceptance.

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

### Step 2.2 — Discovery Primitives — COMPLETE / LOCKED

The implementation is in `packages/validation/src/discovery.ts`, `detection.ts`, `observation.ts`, `runner.ts`, and `normalization.ts`.

Implemented and accepted:

- canonical discovery resource IDs;
- immutable resource records and explicit resource kinds;
- discovery provider abstraction and deterministic resource ordering;
- versioned detection-rule contract;
- structured detection matches and failures;
- deterministic rule execution and failure isolation;
- immutable discovery observations with matched/unmatched/failed status;
- discovery runner and deterministic batch ordering;
- discovery → ingestion normalization boundary;
- normalization tests and end-to-end discovery → ingestion integration tests.

### Step 2.3 — Rule and Analyzer Contracts — COMPLETE / LOCKED

The locked contract is documented in `docs/02-phase-2/2.3-RULE-AND-ANALYZER-CONTRACTS.md`.

Implemented in `packages/validation/src/`:

- `rule.ts` — stable rule identity/version/capability contract;
- `analyzer.ts` — stable analyzer identity/version/capability contract and failure-isolated execution;
- `plugin.ts` — common rule/analyzer plugin boundary;
- `registry.ts` — in-process registration, lookup, kind/capability discovery, manifest and capability index;
- `orchestration.ts` — deterministic analyzer selection and execution.

### Step 2.4 — Derivation and Inference — COMPLETE / LOCKED

The locked contract is documented in `docs/02-phase-2/2.4-DERIVATION-AND-INFERENCE.md`.

Implemented and accepted:

- explicit derivation rule execution contract;
- stable rule identity and version metadata;
- derived assertion creation through the ordinary domain assertion model;
- derivation records with output/input/evidence lineage;
- provenance construction for derived assertions;
- derivation and provenance repository ports in `UnitOfWork`;
- in-memory and PostgreSQL repository support;
- atomic assertion + derivation + provenance persistence;
- rollback on lineage persistence or commit failure;
- deterministic end-to-end derivation tests.

The implemented flow is:

```text
input assertions + evidence
  → derivation rule
  → derived assertion
  → derivation record
  → provenance record
  → UnitOfWork
  → single commit
```

Phase 2.4 deliberately remains a deterministic derivation boundary. It does not claim a general-purpose probabilistic inference engine, distributed scheduling, dynamic plugin loading, or production-scale inference infrastructure.

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
  validation  Validation contracts, rules, orchestration, validated writes,
              discovery, detection, observations, runners, normalization,
              rule/analyzer/plugin contracts, registry, deterministic analysis,
              and derivation persistence orchestration
  storage/    Repository/unit-of-work contracts, memory and PostgreSQL persistence
              including derivation and provenance repositories
  testing/    Shared test fixtures and assertions
```

## Important architectural contracts

### Immutability

Domain records and validation/provenance/discovery/derivation records are constructed as immutable values. Builders/factories normalize input and return deeply frozen records where the model requires it.

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

### Capability execution boundary

Phase 2.3 separates capability declaration from execution. Plugins expose metadata and implementations; the registry handles in-process discovery; orchestration executes analyzers and returns immutable analysis values. Persistence remains outside this boundary.

### Derivation lineage boundary

Phase 2.4 derives ordinary domain assertions and records their origin explicitly through derivation and provenance. The derived assertion, derivation record, and provenance record share one UnitOfWork transaction. A lineage failure or commit failure rolls the transaction back; no partial derived fact is considered successful.

## Documentation source of truth

The repository distinguishes implementation truth from the early design corpus.

- `docs/README.md` — documentation hierarchy and authority rules.
- `docs/00-source-of-truth/DOCUMENTATION_INDEX.md` — organization of the corpus.
- `docs/00-source-of-truth/CORPUS_MANIFEST.md` — inventory of all 84 original documents.
- `docs/00-source-of-truth/IMPLEMENTATION_MATRIX.md` — design-to-code reconciliation.
- `docs/00-source-of-truth/RECONCILIATION_NOTES.md` — decisions made while reconciling the corpus.
- `docs/ROADMAP.md` — approved next-phase sequence.
- `docs/02-phase-2/2.1-INGESTION-CONTRACT.md` — locked Phase 2.1 contract.
- `docs/02-phase-2/2.2-DISCOVERY-PRIMITIVES.md` — locked Phase 2.2 contract.
- `docs/02-phase-2/2.3-RULE-AND-ANALYZER-CONTRACTS.md` — locked Phase 2.3 contract.
- `docs/02-phase-2/2.4-DERIVATION-AND-INFERENCE.md` — locked Phase 2.4 contract.

Documents 73–84 are treated as the strongest semantic specification set, but their capabilities are not considered implemented unless this status document and the implementation matrix say so.

## Verification state

Phase 1 completion was accepted with CI green. Phase 2.1 implementation, regression tests, and CI are green and the step is locked. Phase 2.2 implementation, regression tests, integration tests, typecheck, and CI are green and the step is locked. Phase 2.3 implementation, regression tests, typecheck, and CI are green and the step is locked. Phase 2.4 implementation, deterministic end-to-end tests, typecheck, test suite, and CI are green and the step is locked.

## What is deliberately NOT claimed yet

- Phase 2.5 completion.
- Production-grade plugin loading/lifecycle/compatibility negotiation.
- Production-grade database migration orchestration beyond the initial migration foundation.
- A complete public API/application surface.
- Full inference engine behavior beyond deterministic derivation.
- Complete ontology authoring and constraint management.
- Production web UX.
- Full conflict-resolution workflows.
- Performance/scaling guarantees.
