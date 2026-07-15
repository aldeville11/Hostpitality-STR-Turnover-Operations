# Sprint 01 — Retrospective

**Sprint:** 01 — auth-sessions  
**Date:** 2026-07-15  
**Facilitator:** Engineering Manager / CTO  
**Status:** Final — Sprint COMPLETE  
**Attendees:** CTO · Engineering Manager · QA Lead · Security Engineer · Product Manager

---

## What went well

- ADR 0002 accepted before auth implementation.  
- Execution Plan S1 scope held; no tenancy leakage.  
- Cookie session contract matches ADR; fail-closed RBAC hooks.  
- Dedicated Acquisition OS CI stayed green through release.  
- Clean packaging branch (PR #24) unblocked merge without marketing-tree pollution.  
- Debt issues #19–#22 filed and linked.

## What slowed us down

- Initial PR #18 stacked `vinton-adler/` onto Auth → root CI failure.  
- Root Hostpitality `tsc` initially typechecked nested `acquisition-os` without workspace deps (fixed via tsconfig exclude).  
- Checklist issues opened only at ERB gate rather than at debt introduction.

## Unexpected discoveries

- Dual CI (Acquisition OS vs repo-root) requires packaging rules for nested monorepos.  
- Architecture “Sprint 1 spine” ≠ Execution Plan S1 — Execution Plan must win for timeboxes.

## Architecture concerns

- In-memory IdentityStore → Postgres with Sprint 2 (#22 overlap).  
- ADR 0004 still Proposed while Vite shell hosts auth.  
- CSRF / rate limit / audit remain Architecture §6 gaps (#19–#21).

## Technical debt introduced

| Item | Tracking |
|---|---|
| CSRF | #19 |
| Auth rate limiting | #20 |
| Audit events | #21 |
| Session lifecycle + durable store | #22 |
| Demo seed / UI password prefills | Guard before shared staging |

## Engineering lessons

- One concern per merge path; never mix marketing trees into platform PRs.  
- Exclude nested workspaces from parent `tsc` includes.  
- `governance:close` before COMPLETE prevents false closures.

## Product lessons

- Empty-shell AC is the correct AuthN bar; invite stub must not invent Membership.

## Documentation improvements

- Release summary + a11y verification recorded for S1 shell.  
- Memory/INDEX use OPEN vs COMPLETE correctly under Engineering Laws.

## Recommended process improvements

- Open debt issues when recording memory debt rows.  
- Prefer main-based packaging PRs for mergeable Completion.

## Risks for next sprint

| Risk | Mitigation |
|---|---|
| Starting S2 before readiness | `governance:pre-sprint -- 2` + STOP for approval |
| Tenancy without ADR 0005 | Prefer Accept ADR 0005 first |
| Treating RBAC hooks as live | Probe 501 / assertPermission throws |

## Actions to carry forward

| Action | Owner |
|---|---|
| Prefer Accept ADR 0005 before Membership | Backend Lead · CTO |
| Postgres IdentityStore with tenancy | Backend Lead |
| Prioritize #19–#22 in backlog | PM · Security |
| Await explicit approval before S2 implementation | All |

## Scorecard

[`scorecards/S01-scorecard.md`](./scorecards/S01-scorecard.md)
