# ADR-003: Initial Persistence

## Status
Accepted

## Decision
PostgreSQL is the initial persistence target. The domain will depend on storage abstractions rather than database-specific APIs.

## Rationale
PostgreSQL provides transactions, constraints, indexing, JSON support, mature tooling, and a practical local development path. A graph database can be introduced later if measured workloads justify it.
