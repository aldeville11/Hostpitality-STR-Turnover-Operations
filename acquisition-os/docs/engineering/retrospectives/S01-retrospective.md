# Sprint 01 — Retrospective (Draft — Law 001)

**Sprint:** 01 — auth-sessions  
**Date:** 2026-07-15  
**Facilitator:** Technical Writer / CTO  
**Status:** Draft — required for closure; sprint remains **OPEN** until merge + Law 001 checklist complete  
**Attendees:** CTO · Staff Architect · Security Engineer · QA Lead · Performance Engineer · Product Manager (ERB)

---

## What went well

- ADR 0002 accepted before auth implementation (correct merge gate discipline).  
- Execution Plan S1 scope held against Architecture §10.2 spine bundling.  
- Cookie session contract matches ADR; fail-closed RBAC hooks.  
- Acquisition OS `npm run verify` / dedicated CI path green for auth package.  
- Project memory for S01 substantially filled.

## What slowed us down

- Long-lived branch polluted the Sprint 1 PR with unrelated `vinton-adler/` history → root Hostpitality CI fails.  
- Constitutive docs (Constitution / Architecture / Execution Plan) still chat-originated — agents re-derive from transcript.  
- Follow-up enterprise security debt issues were not opened at debt introduction (opened at ERB gate as #19–#22).

## Unexpected discoveries

- Architecture “Sprint 1” epic ≠ Execution Plan Sprint 1 row — requires explicit precedence rule (Execution Plan for timebox).  
- Dual CI (Acquisition OS vs repo-root) can disagree; merge gate must name which CI is authoritative per PR scope.

## Architecture concerns

- In-memory IdentityStore delays Postgres alignment (paydown with Sprint 2 tenancy + issue #22).  
- ADR 0004 (web framework) still Proposed while Vite shell ships auth UX wiring.  
- CSRF / rate limit / audit remain Architecture §6 gaps until #19–#21.

## Technical debt introduced

| Item | Tracking | Paydown |
|---|---|---|
| CSRF for cookie sessions | #19 | Before broadening mutating authenticated APIs |
| Auth rate limiting | #20 | Hardening / abuse signal |
| Audit events (login/logout/invite) | #21 | Sprint 3 AuthZ + Audit |
| Session lifecycle (idle, revoke-all, durable store) | #22 | With Postgres + product TTL policy |
| In-memory store | S01 memory | Sprint 2 |
| Demo seed / prefills | S01 memory | Before shared staging |

## Engineering lessons

- One concern per PR; do not accumulate marketing trees onto platform branches.  
- Open GitHub issues when recording debt in memory — Law 001 forbids undocumented debt at merge.

## Product lessons

- “Empty shell” AC is the right bar for AuthN; do not invent Membership theater in invite stubs.

## Documentation improvements

- Ratify Engineering Law 001 + ADR 0007.  
- Persist Constitution / Architecture / Execution Plan under `docs/` (carry-forward action).

## Recommended process improvements

- Enforce Law 001 checklist in sprint-close PR template.  
- Split “implementation PR” from “sprint-close PR” when merge hygiene is at risk.

## Risks for next sprint

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Starting S2 before S1 COMPLETE | M | H | Law 001 STOP rule; CTO/PM authorization required |
| Tenancy without ADR 0005 | M | H | Accept ADR 0005 before Membership model |
| Assuming RBAC is live | M | H | Probe 501 / assertPermission throws |

## Actions to carry forward

| Action | Owner | Due |
|---|---|---|
| Fix PR #18 merge hygiene (no `vinton-adler` pollution) | Platform Engineer | Before S1 COMPLETE |
| Link #19–#22 in PR #18 + keep memory debt table synced | Technical Writer | Before S1 COMPLETE |
| Publish S01 scorecard | ERB | Before S1 COMPLETE |
| Persist Constitution / Architecture / Execution Plan to repo | Technical Architect | Before Sprint 2 planning |
| CTO + PM authorize Sprint 2 only after S1 COMPLETE | CTO · PM | After merge |

## Scorecard link

[`scorecards/S01-scorecard.md`](./scorecards/S01-scorecard.md)
