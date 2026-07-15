# @acquisition-os/api

Sprint 2: Identity (ADR 0002) + Tenancy (ADR 0005/0008).

## Commands

```bash
export SESSION_PEPPER=dev-only-change-me
# optional production Postgres:
# export DATABASE_URL=postgresql://...

npm run migrate -w @acquisition-os/api
npm run dev -w @acquisition-os/api
npm run test -w @acquisition-os/api
npm run test:isolation -w @acquisition-os/api   # mandatory suite
npm run test:coverage -w @acquisition-os/api
```

## Modules

- `identity/` — sessions, login/logout, invite stub
- `tenancy/` — Organization, Location, Workspace, Membership
- `platform/sql-store.ts` — Postgres/PGlite store with required `TenantContext`
- `db/migrations/` — Sprint 2 schema

See `docs/engineering/TENANCY.md` and `docs/engineering/AUTH.md`.
