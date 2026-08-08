# Project Index

Project Index is a knowledge system designed to represent, justify, validate, and expose structured knowledge with explicit identity, temporal state, relationships, evidence, inference, provenance, and validation semantics.

## Project status

**Phase 1 — Foundation: COMPLETE**

The complete Phase 1 foundation has been implemented and accepted by CI. It establishes the repository architecture, canonical domain contracts, evidence/provenance, validation, persistence, migrations, and shared test infrastructure.

**Next:** Phase 2 — Capability Layer.

The exact implementation state is maintained in [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md). The forward roadmap is maintained in [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Phase 1 — Foundation

| Step | Area | Status |
|---:|---|---|
| 1 | Repository structure | Complete |
| 2 | Core domain model | Complete |
| 3 | IDs and canonical identity | Complete |
| 4 | Entity model | Complete |
| 5 | Assertion model | Complete |
| 6 | Relationship model | Complete |
| 7 | Evidence model | Complete |
| 8 | Provenance model | Complete |
| 9 | Validation model | Complete |
| 10 | Persistence layer | Complete |
| 11 | Basic migrations | Complete |
| 12 | Test infrastructure | Complete |

## Architecture

```text
apps/
  api/         Application/API boundary
  web/         Consumer interface boundary

packages/
  core/        Foundational primitives and IDs
  domain/      Entity, assertion, relationship models
  ontology/    Entity/relationship constraints
  evidence/    Source, evidence, provenance, derivation
  inference/  Inference and derivation capabilities
  validation/ Validation, consistency and validated writes
  storage/    Persistence contracts, memory and PostgreSQL adapters
  testing/    Shared test fixtures and assertions
```

## Core implementation principles

- **Canonical identity:** IDs are branded and type-specific.
- **Immutable domain values:** factories normalize and freeze model records.
- **Evidence and provenance:** knowledge can be connected to sources, evidence, activities, and derivations.
- **Explicit validation:** referential, consistency, and temporal validation are modeled as structured results.
- **Transactional persistence:** repository operations are coordinated through a `UnitOfWork` contract.
- **Strict TypeScript:** `exactOptionalPropertyTypes` is enabled; absent optional properties are omitted rather than assigned `undefined`.
- **Test-first foundation:** persistence and domain contracts are backed by deterministic tests and shared testing utilities.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm lint
```

CI is the acceptance gate for phase completion.

## Source of truth

Use these documents in this order:

1. **[`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md)** — what is actually implemented now.
2. **[`docs/ROADMAP.md`](./docs/ROADMAP.md)** — what is planned next.
3. **ADRs under `docs/decisions/`** — why important architectural decisions were made.
4. **Source code and tests** — the executable definition of each contract.

If documentation and implementation diverge, update the documentation as part of the same change rather than allowing the README to become stale.

## Specification

The implementation follows the Project Index conceptual specification developed through Documents 80–84, covering:

- canonical identity;
- temporal state;
- relationship and graph semantics;
- evidence, derivation, and inference;
- validation, consistency, and conflict resolution.
