# Customer Acquisition OS

Monorepo for **Acquisition OS** (Customer Acquisition Operating System).

**Governance:** [ENGINEERING_LAWS.md](./docs/engineering/ENGINEERING_LAWS.md) ([Engineering Constitution](./docs/engineering/ENGINEERING_CONSTITUTION.md) · [Sprint Playbook](./docs/engineering/SPRINT_PLAYBOOK.md) · [ADR 0007](./docs/engineering/adr/0007-sprint-governance.md)) — mandatory sprint lifecycle; quality over velocity.

Sprint **1 (Authentication)** is **COMPLETE** (PR #24). Sprint 2 readiness may run via `governance:pre-sprint -- 2`; **do not implement Sprint 2 until explicitly approved.**

```bash
npm run governance:pre-sprint -- <N>   # required before implementation
npm run governance:close -- <N>        # required before Status=COMPLETE
```

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

- `docs/engineering/ENGINEERING_LAWS.md` — **authoritative sprint governance**
- `docs/engineering/ENGINEERING_CONSTITUTION.md` — Engineering Constitution
- `docs/engineering/SPRINT_PLAYBOOK.md` — sprint operator playbook
- `docs/engineering/ORGANIZATION.md` — roles
- `docs/engineering/GATE_A.md` — strategy lock
- `docs/engineering/AUTH.md` — session auth notes
- `docs/engineering/adr/` — architecture decisions
- `docs/project-memory/` — permanent sprint memory (required before/after every sprint)
