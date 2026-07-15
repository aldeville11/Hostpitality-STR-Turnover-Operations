# Sprint 01 — auth-sessions

**Sprint:** 01  
**Codename / slug:** auth-sessions  
**Dates:** 2026-07-15  
**Status:** Complete  
**Memory author:** Technical Writer  
**Contributors:** Frontend Lead · Backend Lead · QA Lead · Security Engineer · Technical Architect  

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

| Item | Why incurred | Paydown trigger |
|---|---|---|
| In-memory IdentityStore | Ship AuthN without blocking on Postgres operator setup | Sprint 2 tenancy + managed Postgres |
| No CSRF token double-submit | SameSite=Lax covers browser navigations; full CSRF story not in S1 AC | Before cross-site form posts / public embed |
| No auth rate limiting | Not in Execution Plan S1 deliverables | Sprint 3+ hardening or abuse signal |
| No AuditEvent on login | Audit writers = Sprint 3 | Sprint 3 AuthZ + Audit |
| Demo credentials in seed | Local login demonstration | Remove/guard before shared staging |
| Constitution/Architecture/Execution Plan still chat-originated | Not persisted as repo docs in prior phases | Persist canonical copies under `docs/` when product owner directs |

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

## 11. Test Results

| Suite | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | Includes API |
| `npm run lint` | Pass | Includes API eslint |
| `npm run test` | Pass | 12 API tests + package smokes |
| `npm run build` | Pass | api + web-app + web-marketing |
| CI workflow | Pass locally via verify | Same script as `acquisition-os-ci.yml` |
| Other | Pass | login→me→logout; bad password; invite; rbac probe |

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
| Code reviewed + CI green | Yes (verify green; PR for human review) |
| Tenant isolation (if data-touching) | N/A — no tenancy data (invite User only) |
| Unit/integration as applicable | Yes |
| Events/projections as applicable | N/A — no outbox in S1 |
| RBAC server-side as applicable | Hooks only (intentionally not enforced) |
| Observability as applicable | Health endpoints + structured startup log |
| A11y as applicable | Login form labels + alert role on errors |
| Docs updated | Yes |
| Staging/local verify | Local verify + login shell AC |
| Product acceptance | Login shell demo ready — pending reviewer |
| Constitution compliant | Yes (vocabulary + lifecycle; no Synonym drift) |

## 16. Lessons Learned

- Persisting Constitution / Architecture / Execution Plan as files would reduce “required read” risk for future agents.  
- Accepting ADR 0002 before implementation unblocked clean merge criteria.  
- Architecture epic bundling ≠ sprint rows — always prefer Execution Plan for timebox.

## 17. Recommended Next Sprint

**Sprint ID:** 02  
**Primary objective:** Tenancy — Organization, Location, Workspace, Membership CRUD  
**Prerequisites / ADR blockers:** Prefer Accept ADR 0005 (Workspace ↔ Location); wire Postgres IdentityStore  
**Must read before start:** this file + Constitution Identity/Tenancy + Architecture tenancy § + GATE_A.md  
