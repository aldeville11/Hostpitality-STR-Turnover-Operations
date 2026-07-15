# Tenancy API notes (Sprint 2)

**Owner:** Backend Lead  
**Reviewers:** Security Engineer · Product Manager  
**ADRs:** [0005](./adr/0005-workspace-location.md) · [0008](./adr/0008-durable-sql-store.md)

## Surface (`/api/v1`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/organizations` | Create Organization |
| GET | `/organizations/:organizationId` | Get org (tenant-checked when membership present) |
| POST | `/organizations/:organizationId/locations` | Create Location |
| GET | `/organizations/:organizationId/locations/:locationId` | Get Location (org-scoped) |
| POST | `/organizations/:organizationId/workspaces` | Create Workspace + location bindings (ADR 0005) |
| GET | `/organizations/:organizationId/workspaces/:workspaceId` | Get Workspace |
| POST | `/organizations/:organizationId/memberships` | Assign Membership |
| GET | `/organizations/:organizationId/memberships` | List Memberships |

All mutating/admin paths require authenticated session (`aos_session`).

## Tenant isolation

- Hard boundary: `organization_id`
- Repository methods require `TenantContext`
- Membership cannot reference foreign Workspace/Location
- Actors with Membership for Org A receive **403** on Org B paths
- Permanent suite: `apps/api/src/tenancy/tenant-isolation.suite.test.ts` (`npm run test:isolation -w @acquisition-os/api`)

## Domain events (minimal)

Persisted to `domain_events` (no async publisher in S2):

- `organization.created`
- `location.created`
- `workspace.created`
- `membership.assigned`
- `membership.revoked` (via store revoke)

## AuthContext

After active Membership, `/auth/me` and login populate `organizationId`, `workspaceId`, `role`, `locationScope`.  
**RBAC enforcement is still Sprint 3** (`assertPermission` → `RBAC_NOT_READY`).

## Persistence

```bash
export SESSION_PEPPER=...
# optional: export DATABASE_URL=postgresql://...
npm run migrate -w @acquisition-os/api
npm run dev -w @acquisition-os/api
```

Without `DATABASE_URL`, API boots with embedded PGlite (dev/test convenience; production must set Postgres).
