# Authorization model (Production Foundation v1)

## Company tenancy (primary)

Every tenant-owned read and mutation is scoped by `companyId` first. Cross-company IDs must not succeed.

## Role permissions (RBAC)

`src/lib/rbac.ts` defines six roles and permission strings. Server pages and actions call `requireUser({ permission })`.

## Property accessScope (Option A — enforced)

`User.accessScopeJson` stores:

```json
{ "allProperties": true, "propertyIds": [] }
```

or a restricted list:

```json
{ "allProperties": false, "propertyIds": ["…"] }
```

Rules (`src/lib/access-scope.ts`):

1. Parse with Zod; malformed JSON fails closed to zero properties (never widens).
2. `allProperties: true` = company-wide access within the user’s role.
3. Restricted scopes apply permitted property IDs to property-linked reads and mutations (properties, turnovers, issues, QA, inventory, dashboard, reports, assignments).
4. Foreign or unknown property IDs are rejected when saving scope (`sanitizeAccessScopeForCompany`).
5. Company-level resources (SOP/SOW templates, integrations, vendors as company entities) remain company-scoped only.

Audit: `docs/audits/tenant-isolation.csv` — unresolved must remain 0.
