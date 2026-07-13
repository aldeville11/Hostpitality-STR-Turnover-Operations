# Hostpitality — Project Handoff

## Production Foundation v1 (2026-07-13)

**Branch:** `cursor/production-foundation-v1`

**Database:** PostgreSQL via Prisma migrations (`baseline_postgresql`, `query_indexes`, `session_hmac_additive`, `session_drop_raw_token_contract`, `job_claim_fencing`). SQLite is not a production runtime.

**Security hardening:**
- `src/lib/env.server.ts` — lazy validation, fail-closed production; `JOB_LEASE_SECONDS` bounded 60–3600 (default 900)
- Session HMAC-SHA-256 (`SESSION_PEPPER`), no raw token storage
- Auth bypass requires `ALLOW_AUTH_BYPASS=true` in development only; bypass 404 does not disclose demo email
- `POST /api/jobs/process` requires `CRON_SECRET`; customer global job trigger removed
- Redis rate limiting on login/signup (fail closed in production)
- **Source-derived** tenant audit: `docs/audits/tenant-isolation.csv` via `npm run audit:authorization` (**281 paths**: 248 Verified safe, 28 Fixed, 5 Not tenant-owned, **0 Unresolved**; 75 server actions)
- **accessScope (Option A):** `composePropertyIdFilter` + SOP/SOW `assertPropertyIdsAuthorizedForLink` (atomic)
- Job claim fencing: `claimToken` + `leaseExpiresAt`; terminal updates require matching claim
- Demo seed: local disposable hosts only; RFC1918 requires exact allowlist + `SEED_CONFIRM_REMOTE`
- Rate-limit IP identity: `TRUST_PROXY=none|vercel|single-hop` (`docs/ops/rate-limiting.md`)
- Vitest + `.github/workflows/ci.yml` includes `audit:authorization`

**Monitoring:** Provider-neutral logger adapter only. External alerting is an accepted operational risk.

**F-L1 disposition:** `revokeSessionsOnPasswordChange` is a documented future-hook helper — no password-change product path in v1.

**Verification:** see PR #16 CI and local `npm run verify`.

---

## 1. Product Summary

Hostpitality is a Next.js web application for **short-term rental (STR) turnover operations** — coordinating cleaning windows, field staff, quality assurance, issues, and operational standards across a property portfolio. Evidence: `README.md`, `package.json` description, and UI copy in `src/components/sidebar.tsx`.

It serves **property managers, cleaning coordinators, ops managers, and field vendors/cleaners** via role-based access (`src/lib/rbac.ts`). The core problem is running repeatable guest-ready turnovers: schedule jobs from bookings, assign cleaners, execute SOP/SOW checklists, pass QA/photo review, track defects, and report portfolio health.

The main workflow: **onboard a company → configure properties, SOPs, SOWs, and vendors → run daily turnovers → assign cleaners → complete checklists → QA review → resolve issues → report and notify owners**. Data persists in **PostgreSQL** via Prisma (`prisma/schema.prisma`).

## 2. Current User Experience

**Entry:** `/` redirects unauthenticated users to `/login`, or in non-production to `/api/auth/bypass` (`src/app/page.tsx`, `src/lib/auth.ts`). Demo seed: `manager@hostpitality.app` / `demo1234` (`README.md`, `prisma/seed.ts`).

**Signup/login:** `/signup` creates company + `OPS_MANAGER` user (`src/lib/actions.ts`). `/login` uses email/password sessions (`hp_session` cookie, `src/lib/auth.ts`). Onboarded users hitting app routes without a session get bypass in dev.

**Onboarding:** Eight steps with save/resume in `Company.onboardingProgress` (`src/lib/onboarding.ts`): company, properties, calendars (optional), SOPs, SOWs, vendors, review, activate. Incomplete companies are redirected from `src/app/(app)/layout.tsx` to `/onboarding`.

**Daily ops:** Sidebar groups Operations (dashboard, properties, turnovers, cleaners, inventory), Quality (SOPs, SOWs, QA, issues), Intelligence (reports, integrations), Administration (settings, launch readiness) — `src/components/sidebar.tsx`.

Users can list/filter/sort operational entities, open detail pages, run server actions (assign cleaners, advance turnover status, QA decisions, issue workflow, SOP/SOW publish, integration connect/sync), export report CSVs, and view launch diagnostics at `/launch` (requires `settings:manage`).

## 3. Implemented Features

Verified in code:

- **Auth & RBAC:** Session cookies (HMAC `tokenHash` only), bcrypt passwords, six roles, permission gates (`src/lib/auth.ts`, `src/lib/rbac.ts`), plus optional property `accessScope` enforced after company tenancy (`src/lib/access-scope.ts`)
- **Audit logging:** `AuditLog` model + `writeAuditLog` (`src/lib/audit.ts`)
- **Onboarding:** Multi-step wizard, `markStep`, `activateWorkspace` (`src/lib/onboarding.ts`, `src/lib/onboarding-actions.ts`)
- **Dashboard:** Live metrics from `getDashboardData` (`src/lib/dashboard.ts`, `src/app/(app)/dashboard/page.tsx`)
- **Properties:** List/detail, settings, calendar connection fields, linked SOP/SOW (`src/lib/properties.ts`, `src/lib/property-actions.ts`)
- **Turnovers:** Status machine, checklists, assignment history, photo counters (`src/lib/turnovers.ts`, `src/lib/turnover-actions.ts`)
- **Cleaners:** Vendor profiles, workload, availability, assignment panel (`src/lib/cleaners.ts`, `src/lib/cleaner-actions.ts`)
- **QA:** Inspection queue, checklist/photo review, pass/fail/rework (`src/lib/qa.ts`, `src/lib/qa-actions.ts`)
- **Issues:** Workflow, SLA fields, comments, escalation (`src/lib/issues.ts`, `src/lib/issue-actions.ts`)
- **Inventory:** List with filters and low-stock badges; **no create/edit UI** (`src/app/(app)/inventory/page.tsx`)
- **SOPs/SOWs:** Versioning, publish/archive/duplicate, property linking, SOW approval flow (`src/lib/sops.ts`, `src/lib/sows.ts`)
- **Reports:** Overview/property/QA/cleaner views + client CSV export (`src/lib/reports.ts`, `src/components/reports/export-panel.tsx`)
- **Integrations:** 8-provider catalog, connect/enable/sync UI; sync uses mock payloads (`src/lib/integrations.ts`)
- **Settings:** Company, branding, property defaults, users, roles review, system JSON, audit log (`src/lib/settings.ts`)
- **Launch readiness:** Integrity scan, smoke tests, job observability (`src/lib/launch.ts`, `src/app/(app)/launch/page.tsx`)
- **Background jobs:** Enqueue/process via Prisma + `/api/jobs/process` (`src/lib/jobs.ts`)
- **Owners hub:** Notification metrics + link to reports; **no Owner CRM** (`src/app/(app)/owners/page.tsx`)

## 4. Application Architecture

| Layer | Details |
|-------|---------|
| **Framework** | Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (`package.json`) |
| **Frontend** | `src/app/**` routes; `src/components/**` UI; shared tokens in `src/app/globals.css`; enterprise shell in `src/components/app-shell.tsx`, `src/components/sidebar.tsx` |
| **Backend** | Server Components + `"use server"` actions in `src/lib/*-actions.ts`; minimal API routes under `src/app/api/` |
| **Database** | Prisma 5 + **PostgreSQL** (`prisma/schema.prisma`, `DATABASE_URL`); SQLite only as offline transfer source |
| **Auth** | Cookie sessions (`Session` model); `requireUser({ permission })` redirects |
| **Integrations** | Prisma `Integration` records; `ensureIntegrations` seeds catalog; `runIntegrationSync` writes bookings/calendar events/files via **mock data** |
| **Deploy config** | `next build` / `next start`; `next.config.ts` sets `allowedDevOrigins` for cloud preview; no Docker/k8s in repo |

## 5. Important Files

| Path | Purpose | Why it matters |
|------|---------|----------------|
| `prisma/schema.prisma` | All entities & relations | Source of truth for data model |
| `prisma/seed.ts` | Demo company “Pacific Stay Ops” | Local dev + smoke tests depend on it |
| `src/lib/auth.ts` | Sessions, bypass, `requireUser` | Gate for every protected route |
| `src/lib/rbac.ts` | Roles & permissions | Feature access matrix |
| `src/lib/turnovers.ts` | Turnover lifecycle rules | Core ops workflow |
| `src/lib/issues.ts` | Issue workflow & SLA | Defect tracking |
| `src/lib/integrations.ts` | Catalog + sync (mock) | External systems boundary |
| `src/lib/launch.ts` | Integrity, smoke, readiness | Launch page + `npm run smoke` |
| `src/lib/dashboard.ts` | Dashboard aggregation | Command-center metrics |
| `src/lib/reports.ts` | Reporting + CSV datasets | Intelligence hub |
| `src/components/sidebar.tsx` | Primary navigation | Product surface map |
| `src/app/(app)/layout.tsx` | Auth + onboarding guard | App shell entry |
| `scripts/smoke-core.ts` | CLI smoke runner | Merge/launch verification |
| `.env.example` | `DATABASE_URL`, `AUTH_SECRET` | Required env documentation |

## 6. Current Data Model

**Company** → users, properties, vendors, sops, sows, turnovers, inventory, issues, integrations, jobs, QA, audit.

**Property** → optional sop/sow/defaultVendor; bookings, turnovers, inventory, issues.

**Vendor** (type CLEANER/COORDINATOR/etc.) → turnover assignments, default properties, issue assignee.

**Booking** → optional one **Turnover** (window, status, photos, vendor, checklist, QA, issues, status/assignment events).

**Sop/Sow** → version history; linked to properties and turnovers. SOW has approval fields (`approvedAt`, status flow).

**QaInspection** → items, photo reviews, events; can spawn **Issues**.

**Issue** → comments, events; links property/turnover/QA/vendor.

**Integration** → sync events, webhook logs, calendar events, stored files.

**BackgroundJob** → typed jobs (`turnover.remind`, `turnover.overdue_check`, `notification.dispatch`).

## 7. Incomplete or Broken Areas

**Mock / simulated (not production integrations):**
- `mockBookingPayloads` and `mockCalendarEvents` in `src/lib/integrations.ts` — sync creates real DB rows from fake payloads, not live APIs.

**Missing product surfaces:**
- No Owner model or owner directory (`src/app/(app)/owners/page.tsx` documents this).
- No inventory item detail page or inventory CRUD actions in UI (list-only).
- No dedicated automated test suite in `package.json` (only `smoke`; `scripts/e2e-onboarding.ts` exists but is not an npm script).

**Dev-only / temporary:**
- Auth bypass at `/api/auth/bypass` enabled when `NODE_ENV !== "production"` unless `AUTH_BYPASS=0` (`src/lib/auth.ts`).
- `AUTH_SECRET` appears in `.env.example` but is **not referenced** in application code (Unverified need).

**Legacy / secondary UI:**
- SOP/SOW editor and create sidebars retain older section chrome (non-blocking).
- Redirect routes: `/assignments` → `/cleaners`, `/sow-templates` → `/sows` (`src/app/(app)/assignments/page.tsx`, `src/app/(app)/sow-templates/page.tsx`).
- `README.md` lists only Phases 1–4; git history includes Phases 5–14 (docs drift).

**Operational notes:**
- PostgreSQL is required for production; see `docs/ops/database.md` for migration and transfer procedures.
- Smoke reports “1 failed remaining” background job after processing (`scripts/smoke-core.ts` output) while still passing all checks.
- Inventory page does not enforce `inventory:manage` permission despite RBAC defining it.

## 8. Current Product Positioning

*(Inference from UI copy and navigation)*

Hostpitality positions itself as an **enterprise STR turnover operations platform** — not a generic PMS. Language emphasizes “command center,” “launch readiness,” “quality & standards,” and “intelligence” (`src/components/sidebar.tsx`, dashboard/launch headers). It targets **multi-property operators** who need SOP/SOW governance, field dispatch, QA evidence, and pre-launch integrity checks rather than guest booking management alone.

## 9. Immediate Priorities

**Verified defects / gaps:**
1. Integrations are simulated — no OAuth or real channel APIs (`src/lib/integrations.ts`).
2. Inventory is read-only in UI despite schema + permission existing.
3. `AUTH_SECRET` documented but unused; sessions use opaque tokens without JWT verification in code.
4. SQLite limits production deployment path.
5. README/docs lag behind implemented phases (Phases 5–14 merged; see git `5be0bf6`).

**Recommendations (not verified blockers):**
- Add production auth hardening (disable bypass, wire `AUTH_SECRET` or remove it).
- Postgres migration + deployment manifest.
- Formal test script (`e2e-onboarding`) in CI.
- Real integration connectors or clearly label sync as demo-only in UI.

## 10. Verification

Run on `main` at handoff time (2026-07-12):

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run lint` | **PASS** (exit 0) |
| `npm run smoke` | **PASS** — 8/8 tests (`scripts/smoke-core.ts` → `src/lib/launch.ts`) |
| `npm run build` | **PASS** (exit 0) |
| Formal unit/e2e test suite | **Not present** in `package.json` scripts |

**Git:** `main` at merge commit `5be0bf6` (PR #15 enterprise UI + launch hardening). Working tree clean.

**UI migration scope:** Presentation-only per PR #15; business logic, APIs, schema, and routes unchanged by that work (per merge summary). No backend changes verified in this handoff pass.
