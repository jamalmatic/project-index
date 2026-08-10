# Implementation Matrix

This matrix is the bridge between the 84-document design corpus and the code that actually exists.

## Phase 1 — Foundation

| Capability | Implementation | Evidence | Status |
|---|---|---|---|
| Repository structure | TypeScript monorepo with apps/packages | workspace/package layout | IMPLEMENTED |
| Core primitives | IDs, immutable helpers, shared types | `packages/core` | IMPLEMENTED |
| Canonical identity | Branded entity/assertion/relationship/source/evidence IDs | `packages/core`, domain/evidence models | IMPLEMENTED |
| Entity model | Entity factory and immutable model | `packages/domain` | IMPLEMENTED |
| Assertion model | Assertion factory and immutable model | `packages/domain` | IMPLEMENTED |
| Relationship model | Relationship factory and immutable model | `packages/domain` | IMPLEMENTED |
| Evidence model | Source and evidence records | `packages/evidence` | IMPLEMENTED |
| Provenance model | Provenance records and derivations | `packages/evidence` | IMPLEMENTED |
| Validation model | Structured issues/results and validation rules | `packages/validation` | IMPLEMENTED |
| Referential validation | Cross-reference checks against persistence unit of work | `packages/validation` | IMPLEMENTED |
| Consistency validation | Relationship/assertion consistency checks | `packages/validation` | IMPLEMENTED |
| Validated writes | Validation before transactional persistence | `packages/validation` | IMPLEMENTED |
| Persistence contract | Repository + UnitOfWork abstractions | `packages/storage` | IMPLEMENTED |
| Memory persistence | Transactional reference implementation | `packages/storage` | IMPLEMENTED |
| PostgreSQL adapter | Transaction-aware PostgreSQL persistence boundary | `packages/storage` | IMPLEMENTED |
| Basic migrations | Initial PostgreSQL schema | `packages/storage/migrations` | IMPLEMENTED |
| Shared test infrastructure | Fixtures and immutable assertions | `packages/testing` | IMPLEMENTED |

## Phase 2 — Capability Layer

| Capability | Implementation | Evidence | Status |
|---|---|---|---|
| Ingestion contract | Normalized batch ingestion with validation and atomic persistence | `packages/validation/src/ingestion.ts`, ingestion/integration tests | IMPLEMENTED / LOCKED |
| Discovery resources | Immutable discovery resource contract and providers | `packages/validation/src/discovery.ts` | IMPLEMENTED / LOCKED |
| Detection rules | Versioned rule contract, matches, failures, deterministic execution | `packages/validation/src/detection.ts`, `runner.ts` | IMPLEMENTED / LOCKED |
| Discovery observations | Immutable matched/unmatched/failed observations | `packages/validation/src/observation.ts` | IMPLEMENTED / LOCKED |
| Discovery normalization | Conservative discovery → ingestion boundary | `packages/validation/src/normalization.ts` | IMPLEMENTED / LOCKED |
| Rule definition contract | Stable rule identity/version/name/capability contract | `packages/validation/src/rule.ts` | IMPLEMENTED / LOCKED |
| Analyzer contract | Stable analyzer identity/version/capabilities and failure isolation | `packages/validation/src/analyzer.ts` | IMPLEMENTED / LOCKED |
| Plugin boundary | Common rule/analyzer metadata and implementation boundary | `packages/validation/src/plugin.ts` | IMPLEMENTED / LOCKED |
| In-process plugin registration | Registration, lookup, duplicate protection | `packages/validation/src/registry.ts` | IMPLEMENTED / LOCKED |
| Capability discovery | Kind/capability lookup and capability index | `packages/validation/src/registry.ts` | IMPLEMENTED / LOCKED |
| Deterministic analyzer orchestration | Capability selection, execution, stable result ordering, batch ordering | `packages/validation/src/orchestration.ts` | IMPLEMENTED / LOCKED |

## Not yet implemented

The following concepts in the design corpus must not be described as current product capabilities:

- parser-specific package-manager and language analyzers;
- dynamic filesystem/package plugin loading;
- complete plugin lifecycle management;
- plugin compatibility negotiation service;
- scheduler and incremental discovery;
- cache architecture;
- snapshot builder and published snapshot schema;
- independent provenance persistence through the current `UnitOfWork` contract;
- explicit derivation execution and inference orchestration;
- validation profiles and conflict-resolution workflows;
- canonical query/read service;
- Rust/WASM/HTTP consumer APIs;
- PIQL and snapshot query service;
- language-server integration;
- AI-agent integration;
- documentation/build-system integrations;
- snapshot/plugin registries as production services;
- enterprise deployment profiles;
- governance/certification/conformance program.

## Reconciliation rule

A specification can define a target contract without implying that the contract has been implemented. A row is `IMPLEMENTED` only when the repository contains the corresponding code and tests and CI has accepted it.

A capability marked `IMPLEMENTED / LOCKED` is part of the current source-of-truth baseline. Changes to its contract require an explicit documentation update and, where architectural, an ADR.
