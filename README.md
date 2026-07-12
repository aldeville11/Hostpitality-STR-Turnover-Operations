# Hostpitality — Phase 1 Foundation + Phase 2 Onboarding

AI-powered turnover operations for short-term rental cleaning teams and managers.

## Current scope

### Phase 1 — Foundation
- Next.js App Router + Prisma/SQLite
- Session auth, RBAC, audit logs, job scaffold
- App shell with placeholder business screens

### Phase 2 — Onboarding
Multi-step first-run setup with persisted progress:

1. Company
2. Properties
3. Calendars (optional, skippable)
4. SOPs
5. SOW templates
6. Vendors
7. Review
8. Activate first turnover workflow

Progress is stored on `Company.onboardingStep` + `Company.onboardingProgress` and can be resumed anytime.

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

- Demo (already onboarded): `manager@hostpitality.app` / `demo1234`
- New workspace: `/signup` → guided onboarding → `/dashboard`

## Onboarding routes

`/onboarding`, `/onboarding/company`, `/onboarding/properties`, `/onboarding/calendars`, `/onboarding/sops`, `/onboarding/sows`, `/onboarding/vendors`, `/onboarding/review`, `/onboarding/finish`
