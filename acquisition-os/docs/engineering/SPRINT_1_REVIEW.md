# Sprint 1 Review — Authentication

**Date:** 2026-07-15  
**Status:** **OPEN** under [Engineering Law 001](./ENGINEERING_LAW_001_SPRINT_GOVERNANCE.md)  
**ERB verdict:** APPROVE WITH REQUIRED CHANGES (PR #18)  
**Acceptance (Execution Plan):** User can authenticate to empty shell — **Met (implementation)**  
**Closure:** Incomplete — merge not approved; packaging / CI hygiene required  

## Scope delivered

- Session AuthN (cookie sessions per ADR 0002)
- Login / logout in `web-app` (no UI/UX redesign)
- Invite user stub (invited User only; no Membership)
- Unit + integration tests (`@acquisition-os/api`)
- RBAC compatibility hooks (`AuthContext`, `assertPermission` not-ready)
- Acquisition OS CI path: `npm run verify` includes API
- Docs + project memory (status OPEN pending Law 001 closure)

## Explicitly deferred (Execution Plan)

| Sprint | Scope |
|---|---|
| S2 | Organization, Location, Workspace, Membership |
| S3 | RBAC middleware, AuditEvent writers, cross-tenant CI |
| S4+ | Outbox, workers, domain modules |

## Conflict note (resolved without invention)

Architecture §10.2 “platform spine” listed tenancy/RBAC/outbox alongside auth. **Engineering Execution Plan** splits those across S1–S4. Sprint 1 followed the **Execution Plan**.

## Required changes before COMPLETE

1. Fix PR #18 merge hygiene (`vinton-adler/` must not fail root CI).  
2. Link debt issues: [#19](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/19) CSRF · [#20](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/20) rate limit · [#21](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/21) audit · [#22](https://github.com/aldeville11/Hostpitality-STR-Turnover-Operations/issues/22) session lifecycle.  
3. Merge approved after Law 001 merge gate.  

## Artifacts

- Memory: `docs/project-memory/sprints/S01-auth-sessions.md`  
- Retrospective: `docs/engineering/retrospectives/S01-retrospective.md`  
- Scorecard: `docs/engineering/scorecards/S01-scorecard.md` (Overall **7.5**)  

## Sprint 2

**NOT AUTHORIZED** until this sprint is COMPLETE and PM + CTO authorize next sprint (Law 001).
