# Customer Acquisition OS

Monorepo for **Acquisition OS** (Customer Acquisition Operating System).

Constitution-compliant scaffold from **Sprint 0**.

## Packages

| Path | Purpose |
|---|---|
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
npm run verify
```

## Documentation

- `docs/engineering/ORGANIZATION.md` — roles
- `docs/engineering/GATE_A.md` — strategy lock
- `docs/engineering/adr/` — architecture decisions
