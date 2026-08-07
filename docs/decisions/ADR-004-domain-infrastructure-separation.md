# ADR-004: Domain / Infrastructure Separation

## Status
Accepted

## Decision
The domain model must not import API, UI, database, or deployment-specific code. Infrastructure implements interfaces at the appropriate boundary.

## Rationale
Project Index is a semantic system first. Keeping the semantic core independent protects the ontology and knowledge model from implementation churn.
