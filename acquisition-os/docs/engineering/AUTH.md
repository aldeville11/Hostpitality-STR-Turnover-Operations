# Authentication API notes (Sprint 1–2)

**Owner:** Backend Lead  
**Reviewers:** Security Engineer · Frontend Lead  
**ADR:** [0002-authentication.md](./adr/0002-authentication.md) · Tenancy: [TENANCY.md](./TENANCY.md)

## Surface

`apps/api` (Hono modular monolith module) exposes Identity under `/api/v1`.

Cookie session contract is fixed by ADR 0002 (`aos_session`, HttpOnly, SameSite=Lax, Secure in production, HMAC-SHA-256 at rest with `SESSION_PEPPER`).

## AuthContext (RBAC hooks)

Login / `/auth/me` return AuthContext:

```json
{
  "userId": "...",
  "organizationId": null,
  "workspaceId": null,
  "role": null,
  "locationScope": []
}
```

| Field | Sprint 2 behavior |
|---|---|
| `organizationId` / `workspaceId` / `role` / `locationScope` | Populated from the user's **latest active Membership** when present; else null / `[]` |
| Role / permission **enforcement** | Still Sprint 3 — `assertPermission` throws `RBAC_NOT_READY` (`GET /api/v1/auth/rbac/probe`) |

AuthContext never mixes tenants: membership rows are org-scoped; isolation suite asserts `/me` does not expose foreign org data.

## Invite stub

`POST /api/v1/auth/invites` creates a User with status `invited` and an Invite `pending`. No Membership, no email delivery, no Activation playbook.

## Local verify

```bash
export SESSION_PEPPER=dev-only-change-me
npm run dev -w @acquisition-os/api
npm run dev -w @acquisition-os/web-app
# Sign in with demo@acquisition-os.local / ChangeMe-Demo-Only-1!
```

Vite proxies `/api` → `http://localhost:3001`.
