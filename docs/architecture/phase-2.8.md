# Phase 2.8 — Application Workflow and Committed-State Query Boundary

Status: **LOCKED**

## Scope

Phase 2.8 establishes the application workflow boundary for validated ingestion and the read-only unified query boundary backed by live Postgres reads.

## Application capabilities

The application contract exposes exactly five capabilities:

- `query`
- `commands`
- `ingestion`
- `createWriter`
- `close`

Raw persistence objects are not application capabilities. `storage`, `pool`, `UnitOfWork`, transaction clients, `commit`, and `rollback` remain behind the persistence/composition boundary.

## Ingestion workflow

`application.ingestion.ingest()` is the application-facing heterogeneous write workflow. Input is validated through the validation layer, multiple domain records are written through the validated writer, and the workflow returns a named application result.

The workflow does not expose its writer or transaction boundary to callers.

## Unified query boundary

`UnifiedQueryService` combines identity reads with traversal reads. For Postgres, both paths are backed by live reads from the database rather than an in-memory traversal snapshot.

The unified query surface is strictly read-only. It does not expose a writer, `UnitOfWork`, transaction, pool, `commit`, or `rollback` capability.

## Temporal semantics

The application query contract represents **committed database state**.

1. A write performed inside an open `UnitOfWork` is not guaranteed to be visible to an independent application query before commit.
2. After `commit`, subsequent identity and traversal queries observe the committed records.
3. After `rollback`, the written records remain invisible to independent queries.
4. Records committed together as one batch become query-visible as part of the committed state.
5. Query callers do not receive a transaction/session-aware query object and therefore cannot depend on uncommitted transactional state.
6. Traversal results remain deterministically ordered by persisted `id ASC`.

These semantics deliberately avoid introducing transaction-aware query APIs or snapshot/version parameters at the application boundary.

## Verification

The temporal contract is locked by:

- `packages/storage/src/postgres.unified-query.read-after-write.test.ts` — committed read-after-write behavior and live traversal.
- `packages/storage/src/postgres.temporal-consistency.test.ts` — uncommitted visibility, commit visibility, rollback invisibility, committed batch visibility, and absence of transaction-aware query escape hatches.

## Phase boundary

Phase 2.8 is complete when the implementation and the tests above remain green together. Future phases must not weaken the separation between transactional writes and committed-state application reads without an explicit architecture decision.
