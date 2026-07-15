# Sprint 1 — Release Summary

**Product:** Customer Acquisition OS  
**Sprint:** 01 — auth-sessions  
**Release date:** 2026-07-15  
**Merge:** [PR #24](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/pull/24) → `main`  
**Status:** **COMPLETE** (Engineering Laws)

## What shipped

- Cookie-session AuthN per [ADR 0002](./adr/0002-authentication.md) (`aos_session`, HttpOnly, SameSite=Lax, HMAC at rest, bcrypt)
- `apps/api` Identity module: login, logout, me, invite stub, RBAC hooks
- `web-app` login/logout against empty Command Center shell (no UX redesign)
- Unit + integration tests (12 API); `npm run verify` + Acquisition OS CI
- Engineering Laws / ADRs 0007 governance tooling (pre-sprint / close validators)
- Project memory `S01-auth-sessions.md`, scorecard, retrospective

## Acceptance

| Criterion | Result |
|---|---|
| User can authenticate to empty shell | **Met** |
| No Sprint 2 tenancy in release | **Met** |
| Clean packaging (no `vinton-adler/` in merge) | **Met** (PR #24) |

## ADRs

| ADR | Status |
|---|---|
| 0002 Authentication | Accepted |
| 0007 Sprint governance | Accepted |

## Follow-up issues (not blocking COMPLETE)

- #19 CSRF · #20 Auth rate limiting · #21 Audit events · #22 Session lifecycle

## Demo

```bash
cd acquisition-os
export SESSION_PEPPER=dev-only-change-me
npm run dev:api
npm run dev:web
# demo@acquisition-os.local / ChangeMe-Demo-Only-1!
```

## Score

Overall Sprint Score: **7.5** → revised to **8.0** after packaging/CI close (see scorecard).
