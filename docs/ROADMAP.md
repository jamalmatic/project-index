# Project Index — Roadmap

This roadmap is intentionally conservative. A phase becomes "complete" only when its planned contracts are implemented, documented, tested, and accepted by CI.

## Phase 1 — Foundation — COMPLETE

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

## Phase 2 — Capability Layer — NEXT

Phase 2 should turn the foundation into coherent, externally useful capabilities without destabilizing the Phase 1 contracts.

### Proposed workstreams

1. **Knowledge ingestion**
   - input normalization;
   - source/evidence capture;
   - creation of canonical entities/assertions/relationships;
   - provenance attachment.

2. **Inference and derivation**
   - explicit derivation execution;
   - rule registration/execution contracts;
   - derived assertions;
   - derivation provenance.

3. **Validation pipelines**
   - reusable validation profiles;
   - validation reporting;
   - validation-before-persist workflows;
   - conflict/consistency handling.

4. **Query/read capabilities**
   - entity lookup;
   - assertion/relationship traversal;
   - evidence/provenance retrieval;
   - temporal filtering.

5. **Application/API surface**
   - stable service/application contracts;
   - API endpoints only after the underlying capability contracts are settled.

### Phase 2 rule

The list above is a planning boundary, not a claim that these capabilities already exist. Before implementing a Phase 2 step, define its contract, acceptance tests, dependency direction, and persistence implications.

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
