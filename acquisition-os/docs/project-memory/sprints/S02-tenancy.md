# Sprint 02 — tenancy

**Sprint:** 02  
**Codename / slug:** tenancy  
**Dates:** 2026-07-15  
**Status:** COMPLETE  
**Memory author:** Technical Writer  
**Contributors:** CTO · Backend Lead · Frontend Lead · Product Manager · Security Engineer · QA Lead  

> Closed via PR [#27](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/pull/27). `governance:close -- 2` PASS.

---

## 1. Sprint Summary

Sprint 2 delivered Tenancy foundations: Organization, Location, Workspace, and Membership CRUD with hard Organization isolation, SQL-backed Identity/Tenancy store (ADR 0008), AuthContext population from Membership, minimal domain events, and a permanent Tenant Isolation Test Suite required in CI. RBAC enforcement and outbox workers remain out of scope.

## 2. Objectives Completed

- [x] Organization domain CRUD  
- [x] Location domain CRUD  
- [x] Workspace domain CRUD (ADR 0005)  
- [x] Membership model  
- [x] Postgres/SQL IdentityStore (pg + PGlite)  
- [x] Tenant boundaries + isolation suite  
- [x] AuthContext population  
- [x] Minimal domain events  
- [x] Unit + integration tests + coverage  
- [x] Documentation + memory  
- [x] Merge + `governance:close -- 2`

## 3. Files Created

| Path | Purpose |
|---|---|
| `apps/api/src/db/**` | SQL client, migrations, migrate CLI |
| `apps/api/src/platform/**` | SqlPlatformStore + types |
| `apps/api/src/tenancy/**` | Service, routes, tests, isolation suite |
| `docs/engineering/TENANCY.md` | API notes |
| `docs/engineering/adr/0008-durable-sql-store.md` | Persistence ADR |
| `docs/engineering/SPRINT_2_RELEASE_SUMMARY.md` | Release summary |
| `docs/engineering/SPRINT_2_COVERAGE.md` | Coverage report |
| `docs/engineering/retrospectives/S02-retrospective.md` | Retrospective |
| `docs/engineering/scorecards/S02-scorecard.md` | Scorecard |

## 4. Files Modified

| Path | Change |
|---|---|
| `apps/api/src/app.ts` | Wire tenancy + SQL store |
| `apps/api/src/identity/*` | PlatformStore + AuthContext membership |
| `apps/api/package.json` | pg, pglite, coverage, isolation script |
| `.github/workflows/acquisition-os-ci.yml` | Isolation + coverage steps |
| `docs/engineering/AUTH.md` | AuthContext membership population |
| ADR index / SPRINT_2_PLAN | Approved + 0008 |

## 5. ADRs Added

| ADR | Title | Status |
|---|---|---|
| 0005 | Workspace ↔ Location | Accepted (plan) |
| 0008 | Durable SQL store | Accepted |

## 6. Product Decisions

- Admin API fulfills create-workspace + assign-membership AC without UI redesign.  
- Empty membership `location_scope` = all workspace locations.

## 7. Engineering Decisions

- PGlite for CI/local without DATABASE_URL; `pg` when URL set.  
- TenantContext required on all tenancy repository methods.  
- Domain events table without async outbox (S4).

## 8. Technical Debt Introduced

| Item | Paydown |
|---|---|
| Multi-membership AuthContext = latest active | Workspace switcher / explicit selection |
| No outbox publisher | Sprint 4 |
| Coverage gaps on CLI/exports | Optional cleanup |
| #19–#21 remain | Hardening / S3 |

## 9. Risks Identified

| Risk | Mitigation |
|---|---|
| Treating AuthContext as RBAC | assertPermission still throws |
| PGlite vs managed Postgres drift | Shared migration SQL |

## 10. Blockers

| Blocker | Status |
|---|---|
| Plan approval | Resolved |
| ADR 0005 | Resolved — Accepted |
| Merge to main | Resolved — PR #27 |

## 11. Test Results

| Suite | Result |
|---|---|
| Unit/integration | 23 passed |
| Tenant Isolation Suite | 9 passed (mandatory) |
| Coverage | ~81.4% statements |
| `npm run verify` | Pass (local + Acquisition OS CI) |

## 12. Performance Impact

Org-scoped indexes on locations/workspaces/memberships/events. Event append synchronous and small.

## 13. Security Considerations

Hard org isolation; cross-tenant API/repo attempts fail closed; AuthContext never mixes tenants; RBAC not claimed live.

## 14. Documentation Updated

TENANCY.md, AUTH.md, ADR 0008, release/coverage/retro/scorecard.

## 15. Definition of Done Verification

| DoD item | Met? |
|---|---|
| CI + review | Yes — PR #27 |
| Tenant isolation | Yes — suite |
| Unit/integration | Yes |
| Events | Yes — minimal |
| RBAC server-side | Hooks + context only (S3) |
| Docs | Yes |
| Product AC | Yes |
| Constitution | Yes |

## 16. Lessons Learned

- Isolation suite as first-class CI prevents silent tenancy bugs.  
- Approve ADR 0005 before Membership.

## 17. Recommended Next Sprint

**Sprint 03 — AuthZ + Audit** (RBAC middleware, deny-by-default, AuditEvent, cross-tenant CI expansion).  
**May start only after `governance:pre-sprint -- 3` PASS + plan approval.**

## 18–20. Law 001

Sprint 2 COMPLETE. Isolation suite mandatory forever. Sprint 3 not started.
