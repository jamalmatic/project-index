# Project Index — Source of Truth

> This document is the authoritative implementation-status record for the repository. Update it whenever a foundation step, architectural contract, or phase boundary changes.

## Current state

**Phase 1 — Foundation: COMPLETE**  
**Phase 2.1 — Ingestion Contract: IN PROGRESS**

Phase 1 is locked as the completed foundation baseline. Its 12 steps passed the phase completion gate with CI green. Phase 2.1 is the first capability-layer workstream and is currently at contract/specification stage.

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

### Step 2.1 — Ingestion Contract — IN PROGRESS

The contract is documented in `docs/02-phase-2/2.1-INGESTION-CONTRACT.md`. Implementation has not yet been declared complete.

The intended flow is:

```text
normalized input
  → canonical domain construction
  → evidence + provenance
  → validation
  → atomic persistence
```

The completion gate requires deterministic canonicalization, evidence/provenance traceability, validation-before-persist, atomic rollback behavior, and an explicit duplicate policy.

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
  validation/ Validation contracts, rules, orchestration and validated writes
  storage/    Repository/unit-of-work contracts, memory and PostgreSQL persistence
  testing/    Shared test fixtures and assertions
```

## Important architectural contracts

### Immutability

Domain records and validation/provenance records are constructed as immutable values. Builders/factories normalize input and return deeply frozen records where the model requires it.

### Branded identity

IDs are nominal/branded TypeScript values. Cross-entity IDs are intentionally not interchangeable; this prevents assertions, relationships, entities, evidence, etc. from being accidentally mixed at compile time.

### Optional properties

The repository uses `exactOptionalPropertyTypes`. Implementations must omit absent optional fields rather than constructing properties whose value is explicitly `undefined`.

### Validation

Validation is modeled as a domain capability rather than an ad-hoc collection of checks. Validation produces structured issues and results and supports referential, consistency, temporal, and orchestrated validation.

### Persistence

Persistence is behind repository and `UnitOfWork` contracts. The in-memory implementation is the reference behavioral implementation for transaction semantics; PostgreSQL is the database adapter.

### PostgreSQL representation

The initial migration persists the canonical domain record in JSONB `data` columns with stable text primary keys and operational timestamps. Reference-oriented indexes are present for common assertion, relationship, and evidence lookups.

## Documentation source of truth

The repository distinguishes implementation truth from the early design corpus.

- `docs/README.md` — documentation hierarchy and authority rules.
- `docs/00-source-of-truth/DOCUMENTATION_INDEX.md` — organization of the corpus.
- `docs/00-source-of-truth/CORPUS_MANIFEST.md` — inventory of all 84 original documents.
- `docs/00-source-of-truth/IMPLEMENTATION_MATRIX.md` — design-to-code reconciliation.
- `docs/00-source-of-truth/RECONCILIATION_NOTES.md` — decisions made while reconciling the corpus.
- `docs/ROADMAP.md` — approved next-phase sequence.
- `docs/02-phase-2/2.1-INGESTION-CONTRACT.md` — current Phase 2.1 contract.

Documents 73–84 are treated as the strongest semantic specification set, but their capabilities are not considered implemented unless this status document and the implementation matrix say so.

## Verification state

Phase 1 completion was accepted with CI green. Phase 2.1 has not yet reached its completion gate.

## What is deliberately NOT claimed yet

- Phase 2.1 ingestion implementation is not yet complete.
- Production-grade database migration orchestration beyond the initial migration foundation.
- A complete public API/application surface.
- Full inference engine behavior.
- Complete ontology authoring and constraint management.
- Production web UX.
- Full conflict-resolution workflows.
- Performance/scaling guarantees.

These remain future work and must not be described as implemented functionality.
