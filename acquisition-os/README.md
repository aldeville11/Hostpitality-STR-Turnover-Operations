# Customer Acquisition OS

Monorepo for **Acquisition OS** (Customer Acquisition Operating System).

Sprint **1** authentication is in place (cookie sessions). Tenancy follows in Sprint 2.

## Packages

| Path | Purpose |
|---|---|
| `apps/api` | Modular monolith API — Identity / sessions (Sprint 1) |
| `apps/web-app` | Authenticated product application |
| `apps/web-marketing` | Public front door (must use product-frames) |
| `packages/design-tokens` | Design system tokens |
| `packages/ui` | Shared UI primitives |
| `packages/product-frames` | Command Center / Pipeline / Report shells |
| `packages/fixtures` | Demo/test datasets |

## Commands

```bash
cd acquisition-os
npm install
export SESSION_PEPPER=dev-only-change-me
npm run verify
npm run dev:api   # :3001
npm run dev:web   # :5173 (proxies /api)
```

Demo login (non-production seed): `demo@acquisition-os.local` / `ChangeMe-Demo-Only-1!`

## Documentation

- `docs/engineering/ORGANIZATION.md` — roles
- `docs/engineering/GATE_A.md` — strategy lock
- `docs/engineering/AUTH.md` — session auth notes
- `docs/engineering/adr/` — architecture decisions
- `docs/project-memory/` — permanent sprint memory (required before/after every sprint)
