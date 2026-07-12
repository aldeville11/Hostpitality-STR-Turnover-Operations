# Hostpitality

AI-powered turnover operations for short-term rental cleaning teams and managers.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (persistent local database)
- Session auth with RBAC
- Background jobs for reminders, calendar sync, and overdue checks
- AI agent actions gated behind explicit human approval
- Audit logging

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

Also available: `coord@hostpitality.app` / `demo1234`, `cleaner@hostpitality.app` / `demo1234`

## Product scope (v1)

Focuses on cleaning, turnover, and QA only — not a full PMS, guest messaging, booking marketplace, or pricing optimizer.

### Screens

Dashboard, Properties, Turnovers, SOPs, SOW Templates, Cleaner Assignments, QA / Photo Review, Issues, Inventory, Owners / Reporting, Settings

### Core workflow

1. Calendar/booking sync creates a turnover
2. SOP Agent loads the property playbook (approval required)
3. SOW Agent defines scope and add-ons (approval required)
4. Cleaning Scheduler Agent assigns a cleaner (approval required)
5. Cleaner Dispatch Agent sends checklist, timing, and photo requirements
6. Checklist / QA Agent verifies completion
7. Photo Verification Agent checks required photos
8. Issue Escalation Agent flags damage or misses
9. Inventory / Restock Agent tracks supplies
10. Owner Update Agent sends completion summaries

### Onboarding

Create company → add properties → import calendars → upload SOPs → define SOW templates → add cleaners/vendors → activate first turnover workflow

## Background jobs

Process due jobs from **Settings → Process due jobs**, or:

```bash
curl -X POST http://localhost:3000/api/jobs/process
```

Job types: `booking.sync`, `turnover.pipeline`, `turnover.remind`, `turnover.overdue_check`, `inventory.alert_scan`
