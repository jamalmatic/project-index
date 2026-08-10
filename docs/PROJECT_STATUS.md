# Project Index — Source of Truth

> This document is the authoritative implementation-status record for the repository. Update it whenever a foundation step, architectural contract, or phase boundary changes.

## Current state

**Phase 1 — Foundation: COMPLETE / LOCKED**  
**Phase 2.1 — Ingestion Contract: COMPLETE / LOCKED**  
**Phase 2.2 — Discovery Primitives: COMPLETE / LOCKED**  
**Phase 2.3 — Rule and Analyzer Contracts: COMPLETE / LOCKED**  
**Next: Phase 2.4 — Derivation and Inference**

Phase 1 is the completed foundation baseline. Phase 2.1, 2.2, and 2.3 are locked after implementation, regression testing, and CI acceptance.

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

The implemented flow is:

```text
DiscoveryResource
  → DetectionMatch
  → PluginRegistry
  → capability selection
  → AnalyzerContract(s)
  → deterministic orchestration
  → AnalysisObservation / AnalyzerFailure
```

Phase 2.3 keeps analysis independent from persistence. Plugin loading, lifecycle management, compatibility negotiation, distributed scheduling, and production plugin services are explicitly not claimed.

### Phase 2.3 architectural guarantees

1. **Stable capability identity.** Rules, analyzers, and plugins have explicit identity and version metadata.
2. **Typed capabilities.** Analyzer capabilities are explicit and constrained to the supported analyzer contract.
3. **Kind safety.** A plugin's declared kind must match its executable implementation.
4. **Duplicate protection.** Registry and registration manifests reject duplicate plugin identities.
5. **Capability discovery.** Consumers can select registered plugins by kind or capability.
6. **Failure isolation.** Analyzer exceptions become structured failures and do not abort unrelated analyzers.
7. **Deterministic execution.** Analyzer selection, observations, failures, and batches have stable ordering semantics.
8. **Persistence separation.** Orchestration produces analysis values and does not bypass the ingestion/persistence boundary.
9. **Immutability.** Contract records and returned orchestration values are frozen where required by the model.

### Phase 2.3 non-goals

Phase 2.3 does not claim:

- parser-specific analyzers;
- dynamic filesystem/package plugin loading;
- complete plugin lifecycle management;
- compatibility negotiation between plugin versions;
- distributed scheduling;
- persistence of analysis observations;
- a production plugin marketplace/service.

### Phase 2.3 acceptance

**COMPLETE / LOCKED.** Typecheck, test suite, and CI acceptance are green. The Rule/Analyzer/Plugin/Registry/Orchestration boundaries are frozen as the baseline for Phase 2.4. Future changes that alter these boundaries require an explicit source-of-truth update and, where architectural, an ADR.

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
              rule/analyzer/plugin contracts, registry and deterministic analysis
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

### Capability execution boundary

Phase 2.3 separates capability declaration from execution. Plugins expose metadata and implementations; the registry handles in-process discovery; orchestration executes analyzers and returns immutable analysis values. Persistence remains outside this boundary.

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

Documents 73–84 are treated as the strongest semantic specification set, but their capabilities are not considered implemented unless this status document and the implementation matrix say so.

## Verification state

Phase 1 completion was accepted with CI green. Phase 2.1 implementation, regression tests, and CI are green and the step is locked. Phase 2.2 implementation, regression tests, integration tests, typecheck, and CI are green and the step is locked. Phase 2.3 implementation, regression tests, typecheck, and CI are green and the step is locked.

## What is deliberately NOT claimed yet

- Phase 2.4 completion.
- Independent provenance persistence through `UnitOfWork`.
- Production-grade plugin loading/lifecycle/compatibility negotiation.
- Production-grade database migration orchestration beyond the initial migration foundation.
- A complete public API/application surface.
- Full inference engine behavior.
- Complete ontology authoring and constraint management.
- Production web UX.
- Full conflict-resolution workflows.
- Performance/scaling guarantees.
