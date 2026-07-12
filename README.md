# Hostpitality — Phase 1 Foundation

AI-powered turnover operations for short-term rental cleaning teams and managers.

## Phase 1 scope

Foundation only:

- Next.js App Router + TypeScript + Tailwind
- Prisma + SQLite
- Session auth (login / signup)
- RBAC helpers (server-side)
- Audit logging
- Background job scaffold
- App shell (sidebar, topbar, UI primitives)
- Placeholder routes for all main sections
- Root redirect to onboarding or dashboard based on auth + setup state

Business screens (dashboard metrics, turnover workflows, SOP editors, etc.) are intentionally deferred.

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

- Email: `manager@hostpitality.app`
- Password: `demo1234`

### New accounts

Use `/signup` to create a company, then complete onboarding by adding a first property.

## Key files

| Area | Path |
|------|------|
| Schema | `prisma/schema.prisma` |
| DB client | `src/lib/db.ts` |
| Auth | `src/lib/auth.ts` |
| RBAC | `src/lib/rbac.ts` |
| Audit | `src/lib/audit.ts` |
| Jobs | `src/lib/jobs.ts` |
| Shell | `src/components/sidebar.tsx`, `src/components/topbar.tsx` |

## Background jobs

```bash
curl -X POST http://localhost:3000/api/jobs/process
```

Scaffolded job types: `turnover.remind`, `turnover.overdue_check`, `notification.dispatch`
