# Sprint 1 Review — Authentication

**Date:** 2026-07-15  
**Status:** Complete — awaiting product/engineering review before Sprint 2  
**Acceptance (Execution Plan):** User can authenticate to empty shell — **Met**

## Scope delivered

- Session AuthN (cookie sessions per ADR 0002)
- Login / logout in `web-app` (no UI/UX redesign)
- Invite user stub (invited User only; no Membership)
- Unit + integration tests (`@acquisition-os/api`)
- RBAC compatibility hooks (`AuthContext`, `assertPermission` not-ready)
- CI path: `npm run verify` includes API
- Docs + Sprint 1 project memory

## Explicitly deferred (Execution Plan)

| Sprint | Scope |
|---|---|
| S2 | Organization, Location, Workspace, Membership |
| S3 | RBAC middleware, AuditEvent writers, cross-tenant CI |
| S4+ | Outbox, workers, domain modules |

## Conflict note (resolved without invention)

Architecture §10.2 “platform spine” listed tenancy/RBAC/outbox alongside auth. **Engineering Execution Plan** splits those across S1–S4. Sprint 1 followed the **Execution Plan** (mission instruction).

## Sign-off checklist

| Role | Item | Status |
|---|---|---|
| Backend Lead | ADR 0002 Accepted + API owns sessions | Done |
| Security Engineer | Cookie flags, bcrypt, no localStorage tokens | Done |
| Frontend Lead | Login shell wiring, credentialed fetch | Done |
| QA Lead | Unit + integration green | Done |
| Technical Architect | Identity module boundary; Postgres store deferred as debt | Done |
