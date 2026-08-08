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

## Not yet implemented

The following concepts in the design corpus must not be described as current product capabilities:

- filesystem/workspace discovery;
- package-manager and language analyzers;
- rule-definition language and parser runtime;
- plugin discovery/execution SDK;
- scheduler and incremental discovery;
- cache architecture;
- snapshot builder and published snapshot schema;
- Rust/WASM/HTTP consumer APIs;
- PIQL and snapshot query service;
- language-server integration;
- AI-agent integration;
- documentation/build-system integrations;
- snapshot/plugin registries;
- compatibility negotiation service;
- enterprise deployment profiles;
- governance/certification/conformance program.

## Reconciliation rule

A specification can define a target contract without implying that the contract has been implemented. A row is `IMPLEMENTED` only when the repository contains the corresponding code and tests and CI has accepted it.
