# Documentation Reconciliation Notes

The attached corpus contains 84 Markdown documents created during the early architecture/specification work. The corpus is valuable and is retained; it is not discarded merely because implementation has progressed.

## Key findings

1. Documents 01–72 are primarily architectural, engineering, discovery, engine, consumer and platform design.
2. Documents 73–84 form a later, more formal semantic specification layer and should be treated as the strongest design reference for the knowledge model.
3. The current repository implements the Phase 1 foundation, not the complete system described by the corpus.
4. Some early documents use terms such as snapshot, discovery, plugin, parser, registry and query API as if they were already part of the executable system. They are design targets, not current capabilities.
5. The current source of truth therefore separates **implemented foundation** from **future design** rather than rewriting historical documents to make them appear current.

## Reorganization policy

The original 84 documents are reorganized into numbered architectural areas while preserving their document numbers and substantive text. This provides stable references without retaining the ambiguous folder names `07-` and `08-`.

## Phase 2 planning rule

Phase 2 will be planned from the intersection of:

- the current Phase 1 implementation;
- the normative semantics in Documents 73–84;
- the capability designs in Documents 33–65;
- the roadmap in `00-source-of-truth/ROADMAP.md`.

No Phase 2 work should be started merely because a document exists. Each capability must receive an explicit implementation status and acceptance criteria first.
