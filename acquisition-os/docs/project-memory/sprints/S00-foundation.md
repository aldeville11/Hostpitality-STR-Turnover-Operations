# Sprint 00 — Foundation

**Sprint:** 00  
**Codename / slug:** foundation  
**Dates:** 2026-07-15  
**Status:** Complete  
**Memory author:** Technical Writer  
**Contributors:** Platform Engineer · CTO · Frontend Lead · Security Engineer · Product Manager  

---

## 1. Sprint Summary

Sprint 0 established the Customer Acquisition OS engineering organization and monorepo foundation. Gate A was ratified from Constitution defaults. ADR backlog was opened (0001 accepted; 0002–0006 proposed). Empty `web-app` and `web-marketing` apps build against shared tokens, UI, fixtures, and product-frames. CI runs `npm run verify`. No customer feature UI or auth was implemented.

## 2. Objectives Completed

- [x] Create engineering organization + PR ownership rules  
- [x] Ratify Gate A strategy locks  
- [x] Open ADR backlog (0001–0006)  
- [x] Scaffold npm workspaces monorepo  
- [x] Add `.env.example` (no secrets committed)  
- [x] Add CI workflow for Acquisition OS verify  
- [x] Produce working empty apps that typecheck, lint, test, and build  
- [x] Record Sprint 0 review  

## 3. Files Created

| Path | Purpose | Owner role |
|---|---|---|
| `acquisition-os/docs/engineering/ORGANIZATION.md` | Role matrix + PR fields | CTO |
| `acquisition-os/docs/engineering/GATE_A.md` | Strategy lock ratification | Product Manager |
| `acquisition-os/docs/engineering/adr/**` | ADR backlog + stubs | CTO |
| `acquisition-os/docs/engineering/SPRINT_0_REVIEW.md` | Sprint 0 acceptance record | Platform Engineer |
| `acquisition-os/package.json` | Workspace root + verify scripts | Platform Engineer |
| `acquisition-os/apps/web-app/**` | Authenticated app shell stub | Frontend Lead |
| `acquisition-os/apps/web-marketing/**` | Public front-door stub (shared frames) | Frontend Lead |
| `acquisition-os/packages/design-tokens/**` | Phase 3 token stub | Frontend Lead |
| `acquisition-os/packages/ui/**` | Button primitive stub | Frontend Lead |
| `acquisition-os/packages/fixtures/**` | Demo KPI/pipeline fixtures | Frontend Lead |
| `acquisition-os/packages/product-frames/**` | Command Center / Pipeline frame stubs | Frontend Lead |
| `acquisition-os/.env.example` | Env template without secrets | Security Engineer |
| `.github/workflows/acquisition-os-ci.yml` | CI verify pipeline | Platform Engineer |

## 4. Files Modified

| Path | Change | Owner role |
|---|---|---|
| Hostpitality branch tree | Added `acquisition-os/` subtree (repo attachment constraint) | Platform Engineer |

## 5. ADRs Added

| ADR | Title | Status |
|---|---|---|
| 0001 | Modular monolith + async workers | Accepted |
| 0002 | Authentication mechanism | Proposed |
| 0003 | Queue technology | Proposed |
| 0004 | Web application framework | Proposed |
| 0005 | Workspace ↔ Location model | Proposed |
| 0006 | Message body storage & encryption | Proposed |

## 6. Product Decisions

- Gate A locked: ICP = multi-location / PE-backed operators; CTA = `Request a demo`; access = sales-assisted Activation; P0 module freeze per Constitution.  
- No product scope expansion in Sprint 0.  
- Public marketing must continue to import `product-frames` (not fake dashboards).

## 7. Engineering Decisions

- npm workspaces monorepo under `acquisition-os/` (Hostpitality is the writable git remote for this agent environment).  
- Vite + React 19 for empty app shells pending final ADR 0004 confirmation.  
- Package build order enforced before app typecheck (`build:packages`).  
- Node test runner for token/ui smoke tests.  
- Nested `.github` workflows moved to repo-root workflow path so CI discovers them.

## 8. Technical Debt Introduced

| Item | Why incurred | Paydown trigger |
|---|---|---|
| Nested inside Hostpitality repo | Cloud agent repo attachment | Dedicated Acquisition OS remote when available |
| Minimal Button/frames vs full design system | Sprint 0 scaffold only | Sprint 11+ UI Spec implementation |
| System font stack in stubs | Avoid layout invention | Design token typography wiring |
| ADR 0002–0006 still Proposed | Decisions require role sign-off | Before dependent sprint merges |

## 9. Risks Identified

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Building inside Hostpitality confuses product boundaries | M | M | Clear `acquisition-os/` README + path filters in CI |
| Proceeding to Auth without ADR 0002 | M | H | Sprint 1 blocked on ADR 0002 |
| Agency landing code in `vinton-adler/` coexists | M | L | Do not treat as Acquisition OS app; OS uses `acquisition-os/` |

## 10. Blockers

| Blocker | Owner | Status |
|---|---|---|
| ADR 0002 authentication decision | Backend Lead + Security Engineer | Resolved — Accepted 2026-07-15 |
| ADR 0004 framework final sign-off | Frontend Lead + CTO | Open — Vite stub provisional |
| Dedicated git remote for Acquisition OS | CTO / Platform | Open — operational constraint |

## 11. Test Results

| Suite | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | After package build order |
| `npm run lint` | Pass | ESLint on both apps |
| `npm run test` | Pass | design-tokens + ui node:test |
| `npm run build` | Pass | both apps Vite production build |
| `npm run verify` | Pass | full gate |
| CI workflow | Added | path-filtered to `acquisition-os/**` |

## 12. Performance Impact

N/A for runtime product traffic. Local `verify` ≈ 14s. Web app / marketing bundles ≈ 196 kB JS gzip ≈ 62 kB (stub shells).

## 13. Security Considerations

- No secrets committed; `.env.example` documents future `SESSION_PEPPER`, `DATABASE_URL`, queue URLs.  
- `.gitignore` excludes `.env*` except example.  
- Auth surface not yet implemented (Sprint 1).  
- Tenant isolation tests not yet applicable (no tenancy code).

## 14. Documentation Updated

- Engineering organization  
- Gate A  
- ADR index + stubs  
- Sprint 0 review  
- Monorepo README  
- **This project memory system** (Sprint 0 is first recorded sprint)

## 15. Definition of Done Verification

| DoD item (Execution Plan) | Met? |
|---|---|
| Code reviewed + CI green | Yes (local verify; workflow added) |
| Tenant isolation (if data-touching) | N/A |
| Unit/integration as applicable | Yes (token/ui smoke) |
| Events/projections as applicable | N/A |
| RBAC server-side as applicable | N/A |
| Observability as applicable | N/A |
| A11y as applicable | Partial — stub UI only; full a11y in feature sprints |
| Docs updated | Yes |
| Staging/local verify | Yes (`npm run verify`) |
| Product acceptance | Yes (Gate A + Sprint 0 checklist) |
| Constitution compliant | Yes (no rejected modules; shared frames path established) |

## 16. Lessons Learned

- Package `typecheck` must follow dependency builds when exports point at `dist`.  
- GitHub Actions only reads root `.github/workflows` — nested package workflows are invisible.  
- Keep Sprint 0 ruthlessly non-feature to protect critical path discipline.

## 17. Recommended Next Sprint

**Sprint ID:** 01  
**Primary objective:** Authentication (sessions) per Execution Plan Sprint 1  
**Prerequisites / ADR blockers:** **ADR 0002 must be Accepted** before auth implementation merge; review ADR 0004 provisional Vite choice  
**Must read before start:** this file · `GATE_A.md` · Constitution Identity/Tenancy sections · Engineering Architecture § Auth  
