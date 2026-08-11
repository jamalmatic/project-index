# Project Index — Roadmap

This roadmap is intentionally conservative. A phase becomes **complete** only when its planned contracts are implemented, documented, tested, and accepted by CI.

## Phase 2 — Capability Layer — ACTIVE

### Step 2.6 — Query/read contract — ACTIVE

Grounded primarily in Documents 52, 56, 57, 63 and the existing persistence layer.

Delivered:

- canonical read/query interfaces;
- entity lookup;
- assertion/relationship traversal;
- evidence/provenance/derivation retrieval;
- true read-only query facades;
- deterministic canonical-ID ordering.

#### Step 2.6.5 — Temporal query semantics — LOCKED DECISION / IMPLEMENTATION BLOCKED

Temporal filtering is explicitly gated on recovery of the authoritative domain temporal contract. The query/storage layer must consume the domain `TemporalContext` semantics and must not invent an independent interval model or encode assumptions such as `validFrom <= queryTime < validTo` without an explicit source-of-truth decision.

See `docs/02-phase-2/2.6.5-TEMPORAL-QUERY-SEMANTICS.md` for the locked decision, acceptance gate, and non-goals.

Acceptance gate for 2.6.5: the authoritative temporal type, semantics, and tests must exist before temporal query code is implemented; memory and PostgreSQL implementations must agree; `pnpm typecheck` and `pnpm test` must be green.

### Step 2.7 — Application composition layer

Grounded primarily in Documents 7, 18, 42, 47 and 55.

Deliver:

- application service boundaries;
- dependency injection/composition root;
- stable API/application contracts;
- error mapping;
- integration tests.

## Explicitly deferred beyond Phase 2

The corpus describes a much larger ecosystem. The following are intentionally deferred until the capability layer proves its contracts:

- full snapshot publication/registry;
- Rust and WASM APIs;
- PIQL;
- language-server integration;
- AI-agent integration;
- documentation/build-system integrations;
- plugin compatibility negotiation service;
- enterprise deployment profiles;
- governance/certification/conformance program;
- production-scale caching and distributed scheduling.

## Change-control rule

When implementation diverges from this roadmap:

1. update the relevant source-of-truth document;
2. do not silently mark planned work as complete;
3. record architectural changes as ADRs when they affect package boundaries or domain contracts;
4. keep CI green at phase boundaries.
