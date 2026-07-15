# @acquisition-os/api — Identity / session auth (Sprint 1)

Modular monolith API surface (Hono — Fastify-style). Owns session create/revoke/validate per ADR 0002.

## Endpoints (`/api/v1`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | public | Liveness |
| POST | `/auth/login` | public | Email/password → `aos_session` cookie |
| POST | `/auth/logout` | cookie | Revoke session + clear cookie |
| GET | `/auth/me` | cookie | Current user + AuthContext placeholders |
| POST | `/auth/invites` | cookie | Invite stub (creates `invited` user; no Membership) |
| GET | `/auth/rbac/probe` | cookie | Confirms RBAC not enforced until Sprint 3 |

## Cookie (`aos_session`)

- HttpOnly, SameSite=Lax, Path=/
- Secure in production
- Server stores HMAC-SHA-256(token, SESSION_PEPPER) only

## Local run

```bash
cd acquisition-os
cp .env.example .env.local   # set SESSION_PEPPER
export SESSION_PEPPER=dev-only-change-me
npm run dev -w @acquisition-os/api
```

Demo user (non-production seed): `demo@acquisition-os.local` / `ChangeMe-Demo-Only-1!`

## Persistence

Sprint 1 uses an in-memory IdentityStore for local/CI. Production target remains Managed Postgres (Architecture); swap store in Sprint 2 with tenancy tables.
