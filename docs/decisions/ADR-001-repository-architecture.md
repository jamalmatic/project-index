# ADR-001: Repository Architecture

## Status
Accepted

## Decision
Project Index uses a modular monorepo. Applications live under `apps/`; semantic and infrastructure capabilities live under `packages/`.

## Rationale
The semantic model must remain independent of HTTP, UI, and persistence implementations. This boundary allows the domain to evolve without coupling it to a delivery mechanism.
