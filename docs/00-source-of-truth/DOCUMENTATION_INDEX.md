# Documentation Index

## Purpose

This index reconciles the original 84-document design corpus with the current repository. The original numbering is preserved in filenames where practical so historical references remain traceable, while the directory structure now expresses the architectural area.

## Corpus map

| Documents | New area | Classification |
|---|---|---|
| 01–15 | `10-architecture/` | Reference / partially implemented |
| 16–32 | `20-engineering/` | Reference / partially implemented |
| 33–38 | `30-discovery/` | Planned capability design |
| 39–47 | `40-engine/` | Planned capability design |
| 48–51 | `50-standard-library/` | Planned capability design |
| 52–65 | `60-consumers/` | Planned capability design |
| 66–72 | `70-platform/` | Planned platform design |
| 73–84 | `80-specifications/` | Normative semantic reference; partially implemented |

## Canonical documents

The following documents control current project truth and are not superseded by the historical design corpus:

- `PROJECT_STATUS.md`
- `ROADMAP.md`
- `IMPLEMENTATION_MATRIX.md`
- this index

## Important reconciliation

Documents 73–84 are the strongest semantic specification set in the corpus. They describe the intended knowledge model, identity, evidence/provenance, discovery, plugins, temporal semantics, graph semantics, derivation/inference, and validation. They must be read as **normative design unless the implementation matrix marks a section implemented**.

Phase 1 implemented the foundational subset: repository structure, core primitives and IDs, entities, assertions, relationships, evidence, provenance/derivation, validation, persistence, migrations, and shared testing. Discovery, extraction, plugin execution, snapshots, query APIs, registries, and enterprise/platform capabilities remain future work unless explicitly marked otherwise in `PROJECT_STATUS.md`.

## Empty source document

Original document 76 contained no content. It is intentionally not recreated as a specification; the sequence is preserved by the surrounding numbered documents.
