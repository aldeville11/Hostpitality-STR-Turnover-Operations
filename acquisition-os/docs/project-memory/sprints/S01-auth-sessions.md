# Sprint 01 — auth-sessions

**Sprint:** 01  
**Codename / slug:** auth-sessions  
**Dates:** 2026-07-15  
**Status:** COMPLETE  
**Memory author:** Technical Writer  
**Contributors:** Frontend Lead · Backend Lead · QA Lead · Security Engineer · Technical Architect · CTO · Engineering Manager · Product Manager  

> **COMPLETE under ENGINEERING_LAWS.md** — PR #24 merged to `main`; `governance:close -- 1` passed; debt #19–#22 linked.

---

## 1. Sprint Summary

Sprint 1 delivered Authentication (AuthN) for Acquisition OS: cookie-based sessions per ADR 0002, login/logout against the empty Command Center shell, an invite-user stub without tenancy, RBAC compatibility hooks, and automated unit/integration coverage. Users can authenticate to the empty shell; Organization/Workspace Membership and RBAC enforcement remain Sprint 2–3.

## 2. Objectives Completed

- [x] Accept ADR 0002 (cookie sessions)  
- [x] Authentication foundation (`apps/api` Identity module)  
- [x] Session management (create / validate / revoke)  
- [x] Login/logout flow in `web-app`  
- [x] Invite user stub  
- [x] Unit tests  
- [x] Integration tests  
- [x] RBAC compatibility hooks  
- [x] CI passing (`npm run verify`)  
- [x] Documentation updates  
- [x] Sprint 1 memory entry  

## 3. Files Created

| Path | Purpose | Owner role |
|---|---|---|
| `apps/api/**` | Identity API + session auth | Backend Lead |
| `apps/api/src/identity/*.test.ts` | Unit + integration tests | QA Lead |
| `apps/api/README.md` | API runbook | Backend Lead |
| `docs/engineering/AUTH.md` | Auth API notes | Backend Lead |
| `docs/engineering/SPRINT_1_REVIEW.md` | Sprint 1 acceptance record | Technical Architect |
| `docs/project-memory/sprints/S01-auth-sessions.md` | This memory | Technical Writer |

## 4. Files Modified

| Path | Change | Owner role |
|---|---|---|
| `docs/engineering/adr/0002-authentication.md` | Status → Accepted | Backend Lead · Security Engineer |
| `docs/engineering/adr/README.md` | Index status Accepted | Backend Lead |
| `apps/web-app/src/App.tsx` | Login/logout wiring (no redesign) | Frontend Lead |
| `apps/web-app/vite.config.ts` | `/api` proxy to API | Frontend Lead |
| `package.json` | Include API in verify scripts | Platform Engineer |
| `.env.example` | Session / CORS / API_PORT | Security Engineer |
| `docs/project-memory/INDEX.md` | Register S01 Complete | Technical Writer |
| `README.md` | Document API + auth | Technical Writer |
| `package-lock.json` | Workspace deps | Platform Engineer |

## 5. ADRs Added

| ADR | Title | Status |
|---|---|---|
| 0002 | Authentication mechanism | **Accepted** (was Proposed) |
| — | No new ADR numbers opened this sprint | — |

## 6. Product Decisions

- No product scope expansion; Constitution vocabulary retained (`User` lifecycle `invited → active → deactivated`).  
- CTA / ICP / Activation unchanged (Gate A).  
- Invite stub does **not** create Membership or Activation (sales-assisted path remains S2+).  

## 7. Engineering Decisions

- Followed **Engineering Execution Plan S1** over Architecture §10.2 spine bundling (tenancy/RBAC/outbox deferred).  
- `apps/api` with Hono (Fastify-style modular monolith) — aligns with ADR 0001 + monorepo `apps/*`.  
- In-memory `IdentityStore` for local/CI; Postgres remains production target (swap with tenancy in S2).  
- Demo seed user only outside `production`.  
- Vite shell retained (ADR 0004 still Proposed).  

## 8. Technical Debt Introduced

| Item | Why incurred | Paydown trigger | Tracking |
|---|---|---|---|
| In-memory IdentityStore | Ship AuthN without blocking on Postgres | Sprint 2 tenancy + managed Postgres | S01 memory |
| No CSRF token double-submit | SameSite=Lax interim; not S1 AC | Before cross-site mutating API exposure | [#19](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/19) |
| No auth rate limiting | Not Execution Plan S1 | Hardening / abuse signal | [#20](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/20) |
| No AuditEvent on login | Audit writers = Sprint 3 | Sprint 3 AuthZ + Audit | [#21](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/21) |
| Incomplete session lifecycle | Absolute TTL only in S1 | Idle/revoke-all/durable store | [#22](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/22) |
| Demo credentials in seed / UI prefills | Local login demonstration | Remove/guard before shared staging | S01 memory |
| Constitution/Architecture/Execution Plan still chat-originated | Not persisted as repo docs | Persist under `docs/` | S01 blockers |

## 9. Risks Identified

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Memory store loses sessions on restart | H (local) | L | Expected for S1; document Postgres swap |
| Demo password leaked to shared envs | M | H | Seed disabled in production; rotate pepper |
| Developers assume RBAC is live | M | H | `assertPermission` throws; probe returns 501 |

## 10. Blockers

| Blocker | Owner | Status |
|---|---|---|
| ADR 0002 Proposed blocked Auth merge | Backend Lead · Security Engineer | Resolved — Accepted |
| ADR 0004 web framework still Proposed | Frontend Lead · CTO | Open — Vite provisional OK for shell |
| Canonical Constitution/Architecture/Plan files missing from repo | Technical Architect | Open — chat + memory remain interim source |
| PR #18 packaging / root CI (`vinton-adler`) | Platform Engineer · CTO | Resolved — PR #24 clean merge |

## 11. Test Results

| Suite | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Includes API |
| `npm run lint` | Pass | Includes API eslint |
| `npm run test` | Pass | 12 API tests + package smokes |
| `npm run build` | Pass | api + web-app + web-marketing |
| CI workflow | Pass | Acquisition OS CI + root CI (after tsconfig exclude) on PR #24 |
| Other | Pass | login→me→logout; bad password; invite; rbac probe; a11y shell verify |

## 12. Performance Impact

Negligible: bcrypt cost 12 in production (CPU on login only); session lookup O(1) in memory. Web-app bundle +~2KB gzip for form wiring. No projections/workers yet.

## 13. Security Considerations

- Passwords: bcrypt (cost ≥ 12 prod / 4 test).  
- Sessions: opaque cookie; HMAC-SHA-256 hash at rest with `SESSION_PEPPER`; HttpOnly; SameSite=Lax; Secure in production.  
- No tokens in `localStorage`.  
- Uniform invalid-credential errors (no user enumeration on login path beyond timing).  
- Invite requires authenticated active session.  
- RBAC cannot be silently bypassed via stub — throws not-ready.  
- Remaining: CSRF hardening, rate limits, audit trail, Postgres encryption-at-rest ops.

## 14. Documentation Updated

- `docs/engineering/AUTH.md`  
- `docs/engineering/SPRINT_1_REVIEW.md`  
- ADR 0002 + ADR index  
- `apps/api/README.md`  
- Root `README.md`  
- Project memory INDEX + this file  
- `.env.example`  

## 15. Definition of Done Verification

| DoD item (Execution Plan) | Met? |
|---|---|
| Code reviewed + CI green | Yes — PR #24 merged; Acq OS + root CI green |
| Tenant isolation (if data-touching) | N/A — no tenancy data (invite User only) |
| Unit/integration as applicable | Yes |
| Events/projections as applicable | N/A — no outbox in S1 |
| RBAC server-side as applicable | Hooks only (intentionally not enforced) |
| Observability as applicable | Health endpoints + structured startup log |
| A11y as applicable | Yes — `SPRINT_1_A11Y.md` shell verification |
| Docs updated | Yes |
| Staging/local verify | Yes |
| Product acceptance | Yes — empty-shell AC |
| Constitution compliant | Yes |

## 16. Lessons Learned

- Persisting Constitution / Architecture / Execution Plan as files would reduce “required read” risk for future agents.  
- Accepting ADR 0002 before implementation unblocked clean merge criteria.  
- Architecture epic bundling ≠ sprint rows — always prefer Execution Plan for timebox.  
- Engineering Law 001 now forbids marking COMPLETE without merge + retrospective + scorecard.

## 17. Recommended Next Sprint

**Sprint ID:** 02  
**Primary objective:** Tenancy — Organization, Location, Workspace, Membership CRUD  
**Prerequisites / ADR blockers:** Sprint 1 COMPLETE under Law 001; prefer Accept ADR 0005; wire Postgres IdentityStore  
**Must read before start:** this file + S01 retrospective + scorecard + Constitution Identity/Tenancy + Architecture tenancy § + GATE_A.md + Law 001  
**Authorization:** Readiness via `governance:pre-sprint -- 2` after COMPLETE; **implementation waits for explicit approval**  

## 18. Law 001 Closure Checklist

| Requirement | Met? |
|---|---|
| Sprint objectives completed | Yes |
| Acceptance criteria satisfied | Yes |
| Definition of Done verified | Yes |
| CI passing | Yes (PR #24) |
| Unit tests passing | Yes |
| Integration tests passing | Yes |
| Accessibility verification complete | Yes (`SPRINT_1_A11Y.md`) |
| Security review complete | Yes |
| Performance review complete | Yes |
| Documentation updated | Yes |
| ADRs updated | Yes (0002; 0007) |
| Technical debt documented (with issue links) | Yes (#19–#22) |
| Risks documented | Yes |
| Blockers documented | Yes |
| Sprint memory completed | Yes |
| Pull Request reviewed | Yes |
| Merge approved | Yes (CTO) |
| Merge completed | Yes (PR #24) |
| Retrospective published | Yes |
| Scorecard published | Yes |
| `npm run governance:close -- 1` | Yes |

## 19. Retrospective & Scorecard

- Retrospective path: `docs/engineering/retrospectives/S01-retrospective.md`  
- Scorecard path: `docs/engineering/scorecards/S01-scorecard.md`  
- Release summary: `docs/engineering/SPRINT_1_RELEASE_SUMMARY.md`  
- Overall score: **8.0**  

## 20. Next Sprint Authorization

| Gate | Met? |
|---|---|
| This sprint COMPLETE | **Yes** |
| PM authorizes N+1 (readiness) | **Yes** (`governance:pre-sprint -- 2`) |
| CTO authorizes N+1 (readiness) | **Yes** (`governance:pre-sprint -- 2`) |

**STOP — do not implement Sprint 2 until explicit implementation approval is given (readiness ≠ permission to code).**
