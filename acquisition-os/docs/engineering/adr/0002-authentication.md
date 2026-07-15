# ADR 0002: Authentication mechanism

## Status
**Accepted** — 2026-07-15  
**Sign-off:** Backend Lead · Security Engineer · CTO (architecture concurrence)

## Context
Web app needs secure browser auth; Enterprise SSO arrives in P1.

## Options
1. HTTP-only cookie sessions  
2. Bearer JWT in localStorage (rejected for XSS risk as primary)  
3. Cookie session + BFF

## Decision
**Option 1 — Cookie-based sessions** for P0/Sprint 1:

- Session token: high-entropy random value, only **HMAC-SHA-256 hash** stored at rest (`SESSION_PEPPER`)
- Cookie: `HttpOnly`, `Secure` in production, `SameSite=Lax`, path `/`
- Cookie name: `aos_session`
- Password: bcrypt (cost ≥ 12 in production; 4 in tests)
- P1: OIDC/SAML enterprise SSO issues the **same** session cookie after IdP success — no parallel JWT client store

## Consequences
- `apps/api` owns session create/revoke/validate
- `web-app` uses credentialed `fetch` + redirects; no tokens in `localStorage`
- Invite stub creates users without full tenancy (Sprint 2)

## Non-goals (Sprint 1)
- SSO / OAuth social login  
- Refresh-token rotation protocols beyond session expiry  
- Workspace membership enforcement (Sprint 2–3)
