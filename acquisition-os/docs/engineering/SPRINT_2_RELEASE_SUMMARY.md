# Sprint 2 — Release Summary

**Product:** Customer Acquisition OS  
**Sprint:** 02 — tenancy  
**Date:** 2026-07-15  
**Plan:** [SPRINT_2_PLAN.md](./SPRINT_2_PLAN.md) (**APPROVED** by PM · CTO · Backend Lead · Security Engineer)  
**Status:** **COMPLETE** — merged PR [#27](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/pull/27); `governance:close -- 2` PASS

## What shipped

- Organization / Location / Workspace / Membership admin CRUD APIs
- ADR 0005 Workspace↔Location default (1 Workspace + location filters)
- ADR 0008 Durable SQL store (`pg` + PGlite tests)
- Tenant-scoped repositories (`TenantContext` required)
- AuthContext population from active Membership (no RBAC enforcement)
- Minimal domain events in `domain_events`
- **Permanent Tenant Isolation Test Suite** (mandatory CI)
- Coverage report (~81.4% statements)

## Acceptance

| ID | Result |
|---|---|
| AC-1 Create Organization | Met |
| AC-2 Create Location | Met |
| AC-3 Create Workspace | Met |
| AC-4 Assign Membership | Met |
| AC-5 Postgres/SQL persistence | Met (PGlite in CI; `DATABASE_URL` → pg) |
| AC-6 Cross-org denied | Met (isolation suite) |
| AC-7 Domain events | Met |
| AC-8 Vocabulary | Met |
| AC-9 No S3+/prohibited scope | Met |

## Domain events added

| Event | When |
|---|---|
| `organization.created` | Org create |
| `location.created` | Location create |
| `workspace.created` | Workspace create |
| `membership.assigned` | Membership assign |
| `membership.revoked` | Membership revoke |

## Database migrations

| Migration | Purpose |
|---|---|
| `001_sprint2_tenancy` (`.ts` + `.sql`) | users, sessions, invites, organizations, locations, workspaces, workspace_locations, memberships, domain_events |

## Tests

| Suite | Count | Result |
|---|---|---|
| Auth unit | 9 | Pass |
| Auth integration | 4 | Pass |
| Tenancy CRUD integration | 1 | Pass |
| **Tenant Isolation Suite** | **9** | **Pass (mandatory CI)** |
| **Total** | **23** | **Pass** |

## Coverage

See [SPRINT_2_COVERAGE.md](./SPRINT_2_COVERAGE.md) — ~81.4% statements / lines.

## Performance considerations

- Org-scoped indexes on locations, workspaces, memberships, and domain_events.
- Domain event append is synchronous and small (no fan-out worker in S2).
- PGlite for CI avoids managed-Postgres cold starts; production uses `pg` Pool.

## Security review

| Finding | Disposition |
|---|---|
| Cross-tenant API access | Fail-closed (403 / TenantIsolationError); covered by isolation suite |
| Repository without tenant context | Not permitted — `TenantContext.organizationId` required |
| AuthContext foreign leak | Isolation suite asserts `/me` does not expose Org B |
| Membership cross-tenant attach | Rejected at store + API |
| RBAC enforcement | Explicitly **not** live (`RBAC_NOT_READY`) — correct for S2 |
| CSRF / rate limit / audit module | Deferred — issues #19–#21 |

**Verdict:** Approve for tenancy foundation. No hidden privilege escalation; deny-by-default RBAC remains S3.

## Technical debt introduced

| Item | Paydown |
|---|---|
| Multi-membership AuthContext = latest active | Explicit workspace switcher |
| No async outbox publisher | Sprint 4 |
| Coverage gaps (CLI / exports / some route paths) | Optional cleanup |
| CSRF / rate limit / AuditEvent | #19 #20 #21 |
| Session idle / revoke-all | #22 (durable sessions partially address) |

## Definition of Done verification

| DoD | Met? |
|---|---|
| Plan DoD + AC | Yes |
| Unit + integration tests | Yes |
| Tenant Isolation Suite in CI | Yes |
| Migrations for schema | Yes |
| ADRs (0005, 0008) | Yes |
| Docs (TENANCY, AUTH, release, retro, scorecard, memory) | Yes |
| Technical debt documented | Yes |
| No prohibited scope (RBAC engine, UI redesign, billing, …) | Yes |
| Merge to `main` + `governance:close -- 2` | Yes — PR #27 |

## Demo

```bash
cd acquisition-os
export SESSION_PEPPER=dev-only-change-me
npm run dev:api
# Login, then POST /api/v1/organizations → locations → workspaces → memberships
```

## Retrospective / scorecard / memory

- [S02-retrospective.md](./retrospectives/S02-retrospective.md)
- [S02-scorecard.md](./scorecards/S02-scorecard.md)
- [S02-tenancy.md](../project-memory/sprints/S02-tenancy.md)

## governance:close results

```
governance: PASS — Sprint-close checklist S02 complete (32/32)
governance: PASS — Memory present: S02-tenancy.md
governance: PASS — Retrospective present
governance: PASS — Scorecard present
governance: PASS — Sprint 02 close gate clear
```
