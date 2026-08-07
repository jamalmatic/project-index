# Project Index

Project Index is a knowledge system designed to represent, justify, validate, and expose structured knowledge with explicit identity, temporal state, relationships, evidence, inference, and validation semantics.

## Current implementation phase

**Phase 1 — Foundation**

**Step 1 — Repository Bootstrap & Architecture**

The repository is being built as a modular TypeScript monorepo. The initial implementation deliberately focuses on the engineering foundation before introducing the full semantic model.

## Architecture

```text
apps/
  api/       Application/API boundary
  web/       Future consumer interface

packages/
  core/      Foundational primitives
  domain/    Project Index semantic model
  ontology/  Entity/Relationship constraints
  evidence/  Evidence and provenance
  inference/ Derivation and inference
  validation/Validation and consistency
  storage/   Persistence abstractions
  testing/   Shared test utilities
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Specification

The implementation follows the Project Index conceptual specification developed through Documents 80–84, covering:

- canonical identity;
- temporal state;
- relationship and graph semantics;
- evidence, derivation, and inference;
- validation, consistency, and conflict resolution.

Implementation decisions are recorded as ADRs under `docs/decisions/`.
