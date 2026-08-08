# Project Index Documentation

This directory is the documentation source of truth for the Project Index repository.

## Authority order

1. `00-source-of-truth/PROJECT_STATUS.md` — what is implemented and verified.
2. `00-source-of-truth/ROADMAP.md` — what is planned.
3. `00-source-of-truth/IMPLEMENTATION_MATRIX.md` — design/specification-to-code reconciliation.
4. `00-source-of-truth/DOCUMENTATION_INDEX.md` — complete documentation inventory and organization.
5. Decision records — why an architectural decision was made.
6. Source code and tests — executable contracts.

If a design document conflicts with the implementation, the implementation status and tests win until the design is explicitly adopted. Planned material must never be presented as implemented functionality.

## Organization

- `00-source-of-truth/` — normative project status, roadmap, reconciliation and documentation policy.
- `10-architecture/` — vision, scope, architecture, data model, APIs, storage, security and high-level design.
- `20-engineering/` — algorithms, interfaces, entity schemas and engineering model.
- `30-discovery/` — discovery, evidence, rules and pipeline architecture.
- `40-engine/` — rule language, parsers, plugins, engine, scheduler, cache, snapshots and CLI.
- `50-standard-library/` — canonical rules, parsers, plugins and ontology extensions.
- `60-consumers/` — APIs, registries, query, language-server, AI and build integrations.
- `70-platform/` — deployment, governance, lifecycle, conformance and ecosystem design.
- `80-specifications/` — normative terminology and detailed semantic specifications.
- `90-archive/` — superseded or historical documents retained for traceability.

## Status labels

Every document is conceptually classified as one of:

- **IMPLEMENTED** — reflected by the current code and tests.
- **PARTIAL** — some normative concepts exist, but the document exceeds current implementation.
- **PLANNED** — intended future capability; not currently implemented.
- **REFERENCE** — architectural or conceptual material used to guide future implementation.
- **HISTORICAL** — retained for traceability but no longer authoritative.

The authoritative implementation status is maintained separately from design prose.
