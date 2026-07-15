# ADR 0001: Modular monolith + async workers

## Status
Accepted (Engineering Architecture)

## Context
P0 requires one mental model, hard tenancy, and speed to a conversion loop. Microservices at day zero increase coordination cost without proven scale needs.

## Decision
Ship a **modular monolith API** with **separate worker processes** for integrations, projections, and report jobs. Extract services only when measured load or residency requirements demand it.

## Consequences
- Shared Postgres with module boundaries and outbox pattern
- Simpler deploy for MVP / closed beta
- Code owners must enforce module API boundaries
