# ADR 0008: Durable SQL store for Identity + Tenancy

## Status
**Accepted** — 2026-07-15  
**Sign-off:** Backend Lead · Security Engineer · CTO

## Context
Sprint 1 used an in-memory IdentityStore (local/CI). Sprint 2 requires Postgres-backed persistence and hard Organization tenant boundaries on all tenancy queries.

## Decision
- Ship `SqlPlatformStore` over SQL migrations (`001_sprint2_tenancy`).
- **Production / staging:** `DATABASE_URL` → `pg` Pool (Managed Postgres).
- **Tests / local without DATABASE_URL:** embedded **PGlite** (Postgres-compatible) applying the same migration SQL.
- Every tenancy read/write requires `TenantContext.organizationId`.
- Domain events persist to `domain_events` in-process (minimal); async outbox/workers remain Sprint 4.

## Consequences
- Tenant Isolation Test Suite is mandatory CI.
- Session durable persistence addresses part of #22; idle/revoke-all remain open.
- SQLite is not a production runtime.
