# Hostpitality

AI-powered turnover operations for short-term rental cleaning teams and managers.

## Phases shipped

1. **Foundation** — auth, RBAC, audit logs, jobs scaffold, app shell  
2. **Onboarding** — multi-step setup with save/resume and activation  
3. **Dashboard** — operational command center from live DB state  
4. **Properties** — property list/detail, settings, calendar connections, linked SOP/SOW

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Demo: `manager@hostpitality.app` / `demo1234`

## Properties

- List with turnover readiness scoring  
- Detail: profile, default cleaner, linked SOP/SOW, calendar sync, recent turnovers/issues  
- Settings: operational rules, photo requirements, restock defaults  
- Calendar: booking source + ICS URL + sync status (prep for Phase 5 turnover generation)
