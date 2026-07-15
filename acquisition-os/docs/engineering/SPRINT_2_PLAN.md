# Sprint 2 Plan — Organization, Location & Workspace Foundation

**Status:** AWAITING IMPLEMENTATION APPROVAL  
**Sprint:** 02 — tenancy  
**Governance:** [ENGINEERING_LAWS.md](./ENGINEERING_LAWS.md)  
**Pre-sprint gate:** `npm run governance:pre-sprint -- 2` — **PASS**  
**ADR prerequisite:** [0005](./adr/0005-workspace-location.md) — **Accepted** (this plan)  
**Authoritative timebox:** Engineering Execution Plan **S2 Tenancy** (over Architecture sprint numbering)

> **STOP:** Do not implement until this plan is approved (CTO · Product Manager · Backend Lead).  
> Readiness authorization ≠ implementation approval.

---

## Required reads completed

| Document | Status |
|---|---|
| Product Constitution (Identity / Tenancy / Membership) | Reviewed (transcript source — not yet persisted under `docs/`) |
| Engineering Architecture (tenancy module, Postgres) | Reviewed (transcript source) |
| Engineering Laws | Reviewed on disk |
| Engineering Execution Plan S2 | Reviewed (transcript source) |
| Sprint 1 Release Summary | Reviewed |
| Sprint 1 Retrospective | Reviewed |
| Sprint 1 Memory | Reviewed |
| ADR 0002 | Accepted — reviewed |
| ADR 0005 | **Finalized → Accepted** |

### Conflict note (no invention)

Architecture §10.2/§10.3 bundles or renumbers work differently (spine / “demand”). **Execution Plan** defines Sprint 2 as **Tenancy CRUD only**. This plan follows the Execution Plan. RBAC enforcement, outbox platform, audit, CSRF, and rate limiting remain out of scope.

---

## 1. Objectives

1. Deliver admin **CRUD** for **Organization**, **Location**, **Workspace**, and **Membership** using Constitution fields and lifecycles.  
2. Meet Execution Plan acceptance: **create workspace** and **assign membership**.  
3. Replace Sprint 1 in-memory `IdentityStore` with a **persistent Postgres** implementation for users/sessions **and** tenancy tables (S01 carry-forward).  
4. Enforce **hard Organization tenant boundaries** on all tenancy reads/writes (IDs from DB/session context — never trust client-supplied org as authority alone).  
5. Emit **Sprint-2-required domain events** for tenancy mutations (minimal event records; full outbox/worker platform remains Sprint 4).  
6. Populate `AuthContext` `organizationId` / `workspaceId` / `role` / `locationScope` when an active Membership exists (still **no** RBAC capability enforcement — Sprint 3).  
7. Unit + integration tests; documentation; Sprint 2 memory updates.  

---

## 2. Acceptance Criteria

| ID | Criterion | Source |
|---|---|---|
| AC-1 | Authenticated admin path can **create an Organization** with Constitution-required fields | Constitution + EP S2 |
| AC-2 | Can **create a Location** under an Organization | Constitution + EP S2 |
| AC-3 | Can **create a Workspace** bound to an Organization and one or more Locations per ADR 0005 | EP AC + ADR 0005 |
| AC-4 | Can **assign Membership** (`user_id`, `workspace_id`, `role_key`, `location_scope`, status lifecycle) | EP AC + Constitution |
| AC-5 | Tenancy data persists in **Postgres** across process restarts | Architecture + S01 debt |
| AC-6 | Cross-Organization reads/writes of Location/Workspace/Membership are **denied** | Constitution hard tenancy |
| AC-7 | Creating Workspace / assigning Membership emits required domain events | Sprint 2 events (minimal) |
| AC-8 | Vocabulary frozen: Workspace ≠ Account/Project; Location is scope | Constitution Part 5 |
| AC-9 | No RBAC matrix enforcement, no CSRF/#19, no rate limit/#20, no AuditEvent module/#21 UI redesign | Explicit out of scope |

**Demo (implied by AC):** Create Workspace + assign Membership (admin API path). EP §13 lists no End-S2 demo.

---

## 3. Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Multi-location model thrash | M | H | ADR 0005 Accepted before implementation |
| Scope bleed into Architecture “demand” sprint | M | H | EP S2 row only; no Lead CRUD |
| Treating AuthContext population as RBAC | H | H | Keep `assertPermission` not-ready until S3; document |
| Postgres availability in CI/local | M | H | Use Postgres in CI service or documented PGlite/testcontainer; no SQLite-as-production |
| Event vs outbox ambiguity | M | M | Persist domain_events in same mutation path; async publisher = S4 debt |
| Membership without UX redesign still needs admin API surface | L | M | API-first admin CRUD; no UI redesign |
| Overlap with #22 session lifecycle | L | L | Persist sessions with users; idle/revoke-all remains #22 |

---

## 4. Dependencies

| Dependency | Status |
|---|---|
| Sprint 1 COMPLETE | Done (PR #24 / #25) |
| `governance:pre-sprint -- 2` | PASS |
| ADR 0002 Accepted | Done |
| ADR 0005 Accepted | **Done (this plan)** |
| Explicit **implementation approval** of this plan | **Pending** |
| Managed/local Postgres for `DATABASE_URL` | Required for implementation |
| Constitution vocabulary / Gate A | Unchanged |

**Not dependencies for S2:** ADR 0003 queue, ADR 0004 web framework, ADR 0006 encryption, issues #19–#21.

---

## 5. Definition of Done

Applies Execution Plan §7 proportionally + Engineering Laws closure:

- [ ] Code reviewed; Acquisition OS CI green (`npm run verify`)  
- [ ] Organization tenant isolation covered by integration tests for tenancy APIs  
- [ ] Unit + integration tests for Org / Location / Workspace / Membership CRUD  
- [ ] Domain events recorded for required mutations (no full outbox worker required)  
- [ ] RBAC: AuthContext populated from Membership; **enforcement still deferred to S3**  
- [ ] Observability: structured logs on tenancy mutations / failures  
- [ ] A11y: N/A if no UI change; if any admin shell wiring is required, labels only — **no redesign**  
- [ ] Docs: tenancy API notes; ADR index; memory  
- [ ] Local verify with Postgres  
- [ ] Product accepts AC-1…AC-9  
- [ ] Constitution compliant  
- [ ] Sprint memory + retrospective + scorecard  
- [ ] `npm run governance:close -- 2` PASS before COMPLETE  
- [ ] No Sprint 3 authorization unless S2 COMPLETE  

---

## 6. Proposed technical outline (not implementation)

*Informational for reviewers — code lands only after approval.*

| Area | Approach |
|---|---|
| Module | `apps/api` tenancy module alongside identity |
| Store | Postgres repositories replacing MemoryIdentityStore |
| Schema | `organizations`, `locations`, `workspaces`, `workspace_locations`, `memberships`; migrate `users`/`sessions` |
| API | Versioned `/api/v1` admin CRUD under authenticated session |
| Events | `organization.created`, `location.created`, `workspace.created`, `membership.assigned` / `membership.revoked` (names finalised at implement to match Constitution language; persist to `domain_events`) |
| Frontend | **No redesign** — optional minimal API-driven smoke only if needed for local verify; Command Center shell unchanged |
| RBAC | Continue fail-closed `assertPermission`; roles stored on Membership only |

---

## 7. Explicit out of scope

- RBAC enforcement / policy matrix / cross-tenant CI suite (Sprint 3)  
- Customer-facing features, UI redesign, reporting, AI  
- Audit events module (#21)  
- CSRF (#19), rate limiting (#20)  
- Full outbox publisher/workers (Sprint 4)  
- Session idle/revoke-all beyond durable persistence (#22 remainder)  
- SSO / ADR 0004 framework change  

---

## 8. Approval signatures (implementation gate)

| Role | Decision | Date |
|---|---|---|
| Product Manager | ⬜ Approve / ⬜ Reject | |
| Backend Lead | ⬜ Approve / ⬜ Reject | |
| CTO | ⬜ Approve / ⬜ Reject | |
| Security Engineer (tenancy boundary review) | ⬜ Approve / ⬜ Reject | |

**Implementation must not begin until all four are Approve.**

---

## 9. After approval

1. Implement Sprint 2 only per this plan.  
2. At completion: files list, migrations, events, tests, ADRs, debt, perf, security review, Sprint 2 Review Summary.  
3. `npm run governance:close -- 2`  
4. `npm run governance:pre-sprint -- 3` only if S2 COMPLETE.  
5. If incomplete: do not authorize Sprint 3; stop for review.
