# Database Operations

Hostpitality uses **PostgreSQL** with Prisma migrations. SQLite is not supported at runtime in production.

## Prerequisites

- Node.js `>=20.9.0 <23`
- PostgreSQL 16+
- `DATABASE_URL` pointing to PostgreSQL
- `npx prisma` available via project dependencies

## Procedure A — Brand-new PostgreSQL installation

1. Create an empty database and role.
2. Set `DATABASE_URL` in the deployment environment.
3. Run migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

4. Verify:

```bash
npx prisma migrate status
npm run typecheck
```

5. Do **not** run `prisma db push` in staging or production.
6. Do **not** run the demo seed in production.

## Procedure B — Existing SQLite-to-PostgreSQL transfer

1. Back up the SQLite file and target PostgreSQL database.
2. Apply migrations to an empty PostgreSQL database first (`npx prisma migrate deploy`).
3. Run the transfer helper with explicit source and target:

```bash
tsx scripts/sqlite-to-postgres.ts \
  --source "file:./prisma/dev.db" \
  --target "postgresql://USER:PASS@HOST:5432/hostpitality?schema=public"
```

4. Reconcile row counts printed by the script.
5. Run integrity checks:

```bash
npm run smoke
```

6. For staging/production targets, pass `--confirm=TRANSFER_TO_TARGET`.

**Failure behavior:** The script refuses staging/production without explicit confirmation. It preserves IDs via `createMany` with `skipDuplicates`.

## Procedure C — Existing PostgreSQL baselining

If PostgreSQL already contains the application schema from an earlier `db push`:

1. Back up the database.
2. Baseline with `prisma migrate resolve --applied <baseline_migration>` only after verifying schema parity.
3. Apply remaining migrations with `npx prisma migrate deploy`.

## Session records during transfer

Legacy SQLite `Session` rows store raw bearer tokens. The transfer script **excludes** the Session table entirely. After transfer, users must re-authenticate. Raw tokens are never copied into PostgreSQL.


Migration `session_drop_raw_token_contract` removes the legacy `Session.token` column. **Application rollback is not safe** after this migration. Restore from backup if rollback is required.

## SESSION_PEPPER rotation

1. Deploy new pepper as `SESSION_PEPPER`.
2. Move old value to `SESSION_PEPPER_PREVIOUS` only if dual validation is implemented (not in v1).
3. Rotating pepper invalidates all sessions — users must re-authenticate.

## CRON_SECRET rotation

1. Set `CRON_SECRET_PREVIOUS` to the current secret.
2. Deploy new `CRON_SECRET`.
3. Update cron invoker to use the new secret.
4. Remove `CRON_SECRET_PREVIOUS` after the rotation window.

## Backups and recovery

- Take PostgreSQL snapshots before migrations and transfers.
- Recovery: restore snapshot, rerun `prisma migrate status`, then `npm run verify`.
- After M4, downgrading application code without restoring database is unsupported.

## Redis

Production login/signup rate limiting requires Redis (`REDIS_URL`). If Redis is unavailable, authentication endpoints fail closed in production.
