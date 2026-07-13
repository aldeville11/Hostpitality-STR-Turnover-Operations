# Hostpitality

Turnover Assurance operations platform for professional property managers — verify every property is complete, compliant, and guest-ready before check-in.

## Requirements

- Node.js `>=20.9.0 <23`
- PostgreSQL 16+
- Redis (required for production login/signup rate limiting)

## Quick start (local development)

```bash
npm install
cp .env.example .env.local
# Edit DATABASE_URL to PostgreSQL
npx prisma migrate deploy
npm run dev
```

### Demo seed (development only)

```bash
ALLOW_DEMO_SEED=true SEED_CONFIRM=DESTROY_AND_SEED npm run db:seed
```

Demo credentials: `manager@hostpitality.app` / `demo1234`

Development auth bypass (optional):

```bash
ALLOW_AUTH_BYPASS=true npm run dev
```

## Verification

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run test:security
npm run smoke
npm run build
npm run verify   # typecheck + lint + test:ci + smoke
```

## Database

Hostpitality uses PostgreSQL with Prisma migrations. See [docs/ops/database.md](docs/ops/database.md) for installation, SQLite transfer, session contract migrations, and recovery.

**Do not** use `prisma db push` in staging or production.

## Production foundation

This repository includes Production Foundation v1:

- PostgreSQL migrations (baseline, indexes, session HMAC, contract drop)
- Tenant isolation helpers and audit (`docs/audits/tenant-isolation.csv`)
- Server-side RBAC enforcement and permission-aware navigation
- Session HMAC-SHA-256 with pepper (`SESSION_PEPPER`)
- Cron-protected job processor (`POST /api/jobs/process`)
- Redis distributed rate limiting
- Structured logging with redaction
- Provider-neutral monitoring interface (logger adapter only)
- CI workflow (`.github/workflows/ci.yml`)

External infrastructure (managed PostgreSQL, Redis, TLS, cron scheduler, backups) must be configured at deploy time.

## Key environment variables

See `.env.example`. Required in production:

- `DATABASE_URL` (PostgreSQL only)
- `SESSION_PEPPER`
- `CRON_SECRET`
- `REDIS_URL`
- `RATE_LIMIT_PEPPER`
- `LOG_LEVEL`
- `JOB_BATCH_SIZE`

`AUTH_SECRET` is deprecated and unused.
