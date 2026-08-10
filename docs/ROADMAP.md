# Project Index — Roadmap

This roadmap is intentionally conservative. A phase becomes **complete** only when its planned contracts are implemented, documented, tested, and accepted by CI.

## Documentation gate before Phase 2

The original architecture/specification corpus contains 84 Markdown documents. It has now been inventoried and reconciled against the Phase 1 implementation.

- `docs/00-source-of-truth/DOCUMENTATION_INDEX.md` defines the authority hierarchy and corpus areas.
- `docs/00-source-of-truth/CORPUS_MANIFEST.md` inventories all 84 documents.
- `docs/00-source-of-truth/IMPLEMENTATION_MATRIX.md` separates implemented contracts from future design.
- `docs/00-source-of-truth/RECONCILIATION_NOTES.md` records the important semantic discrepancies and preservation policy.

The corpus is design/reference material unless the implementation matrix marks a capability as implemented.

## Phase 1 — Foundation — COMPLETE / LOCKED

1. Repository structure
2. Core domain model
3. IDs and canonical identity
4. Entity model
5. Assertion model
6. Relationship model
7. Evidence model
8. Provenance model
9. Validation model
10. Persistence layer
11. Basic migrations
12. Test infrastructure

See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for the exact implementation state.

## Phase 2 — Capability Layer — ACTIVE

Phase 2 turns the stable foundation into the first coherent, externally useful knowledge capabilities. The sequence is derived from the 84-document corpus, but no design document is treated as implemented merely because it exists.

### Step 2.1 — Ingestion contract — COMPLETE / LOCKED

Grounded primarily in Documents 16, 18, 23, 33, 34 and 38.

Delivered:

- normalized ingestion input contract;
- source and evidence capture;
- canonical entity/assertion/relationship creation;
- provenance construction and result preservation;
- deterministic ingestion result;
- complete-batch validation;
- intra-batch staged-reference resolution;
- atomic persistence and single-commit semantics;
- rollback behavior and regression tests.

Acceptance gate: **passed**. The implementation and CI are green. See `docs/02-phase-2/2.1-INGESTION-CONTRACT.md` for the locked contract and explicit non-goals.

### Step 2.2 — Discovery primitives — COMPLETE / LOCKED

Grounded primarily in Documents 19, 33–38 and 78.

Delivered:

- resource discovery abstraction;
- deterministic resource normalization and ordering;
- discovery provider boundary;
- versioned detection-rule contract;
- structured matches and failures;
- immutable discovery observations;
- deterministic discovery orchestration;
- conservative discovery → ingestion normalization boundary;
- unit, contract, transaction, and end-to-end integration tests.

Acceptance gate: **passed**. Discovery is deterministic, read-only with respect to the inspected project, explicitly represents detection failures, preserves rule/version provenance, and feeds Phase 2.1 without bypassing validation or persistence boundaries. See `docs/02-phase-2/2.2-DISCOVERY-PRIMITIVES.md` for the locked contract.

### Step 2.3 — Rule and analyzer contracts — NEXT

Grounded primarily in Documents 35–43 and 79.

Deliver:

- rule definition contract;
- analyzer contract;
- plugin boundary;
- registration and capability metadata;
- deterministic execution semantics.

Acceptance gate: a rule/analyzer can be registered, executed, tested, and produce structured evidence without coupling the domain model to a specific parser implementation.

### Step 2.4 — Derivation and inference

Grounded primarily in Documents 39, 42, 83 and the Phase 1 provenance/derivation model.

Deliver:

- explicit derivation execution contract;
- rule/activity identity;
- derived assertion creation;
- input/evidence lineage;
- provenance persistence;
- deterministic derivation tests.

Acceptance gate: every derived assertion has an inspectable derivation chain back to its inputs/evidence.

### Step 2.5 — Validation profiles and conflict handling

Grounded primarily in Document 84 and the existing validation package.

Deliver:

- named validation profiles;
- composable validation rules;
- conflict/consistency classification;
- validation reporting;
- validation-before-persist orchestration.

Acceptance gate: validation is reusable, deterministic, and never silently converts an unresolved conflict into a fact.

### Step 2.6 — Query/read contract

Grounded primarily in Documents 52, 56, 57, 63 and the existing persistence layer.

Deliver:

- canonical read/query interfaces;
- entity lookup;
- assertion/relationship traversal;
- evidence/provenance retrieval;
- temporal filtering where supported by the current model.

Acceptance gate: read APIs expose immutable domain data without leaking persistence implementation details.

### Step 2.7 — Application composition layer

Grounded primarily in Documents 7, 18, 42, 47 and 55.

Deliver:

- application service boundaries;
- dependency injection/composition root;
- stable API/application contracts;
- error mapping;
- integration tests.

Acceptance gate: consumers can use the capability layer without importing internal persistence or validation implementation details.

## Explicitly deferred beyond Phase 2

The corpus describes a much larger ecosystem. The following are intentionally deferred until the capability layer proves its contracts:

- full snapshot publication/registry;
- Rust and WASM APIs;
- PIQL;
- language-server integration;
- AI-agent integration;
- documentation/build-system integrations;
- plugin registry and compatibility negotiation service;
- enterprise deployment profiles;
- governance/certification/conformance program;
- production-scale caching and distributed scheduling.

## Phase 3 — Product/Application Layer — FUTURE

Potential areas, to be refined after Phase 2:

- ingestion workflows and connectors;
- user-facing knowledge management;
- search and exploration;
- provenance/evidence visualization;
- operational administration;
- authentication/authorization;
- production API and web experiences.

## Phase 4 — Scale, Quality & Operations — FUTURE

Potential areas:

- migration/versioning strategy;
- performance and indexing;
- observability;
- background processing;
- caching;
- reliability and recovery;
- security hardening;
- production deployment.

## Change-control rule

When implementation diverges from this roadmap:

1. update the relevant source-of-truth document;
2. do not silently mark planned work as complete;
3. record architectural changes as ADRs when they affect package boundaries or domain contracts;
4. keep CI green at phase boundaries.
