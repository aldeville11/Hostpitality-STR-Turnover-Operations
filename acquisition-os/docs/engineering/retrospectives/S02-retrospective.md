# Sprint 02 — Retrospective

**Sprint:** 02 — tenancy  
**Date:** 2026-07-15  
**Status:** Final — Sprint COMPLETE (PR #27)  
**Facilitator:** Engineering Manager / CTO  

## What went well

- Plan approval gate prevented scope thrash; ADR 0005 locked before code.  
- Execution Plan S2 row respected (no demand/RBAC/outbox creep).  
- Tenant Isolation Suite made cross-tenant failures explicit and CI-mandatory.  
- Shared SQL migration works for PGlite tests and Postgres runtime.

## What slowed us down

- Coverage provider major-version mismatch with Vitest (pinned to v3).  
- Bootstrap tenancy (create org before membership) requires careful AuthContext rules.

## Unexpected discoveries

- Nested Hostpitality `tsc` already excluded `acquisition-os` — kept packaging clean.  
- Empty `location_scope` means all workspace locations (ADR 0005).

## Architecture concerns

- Multiple active memberships: currently “most recent active” for AuthContext (debt).  
- Domain events without outbox publisher (S4).  
- PGlite ≠ production `pg` wire protocol quirks residual risk (mitigated by same SQL).

## Technical debt introduced

| Item | Tracking |
|---|---|
| Multi-membership AuthContext selection | Document — prefer explicit workspace switcher later |
| Async outbox/workers | Sprint 4 |
| RBAC enforcement | Sprint 3 |
| CSRF / rate limit / AuditEvent | #19 #20 #21 |
| Session idle/revoke-all | #22 (persistence done) |

## Engineering lessons

- Require `TenantContext` on every repository method — don’t rely on route checks alone.  
- Isolation suite first prevents accidental cross-tenant APIs.

## Product lessons

- Admin API-first is sufficient for S2 AC without UI redesign.

## Recommended process improvements

- Pin coverage tooling to Vitest major.  
- Persist Constitution/Architecture/EP to `docs/` (carry-forward from S1).

## Risks for next sprint

| Risk | Mitigation |
|---|---|
| Enabling RBAC incorrectly | Keep assertPermission not-ready until S3 stories |
| Skipping isolation suite | CI step mandatory |

## Actions to carry forward

| Action | Owner |
|---|---|
| Sprint 3 AuthZ + Audit (#21) | Security · Backend |
| Outbox publisher S4 | Platform |
| Explicit workspace switcher | Frontend · Product |

## Scorecard

[`scorecards/S02-scorecard.md`](./scorecards/S02-scorecard.md)
