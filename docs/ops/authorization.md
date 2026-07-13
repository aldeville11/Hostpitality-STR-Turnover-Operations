# Authorization model (Production Foundation v1)

## Company tenancy (primary)

Every tenant-owned read and mutation is scoped by `companyId` first. Cross-company IDs must not succeed. `companyId` is taken from the authenticated session or trusted job context — never from client input as authority.

## Role permissions (RBAC)

`src/lib/rbac.ts` defines six roles and permission strings. Server pages and actions call `requireUser({ permission })`. Sidebar filtering is UX only.

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
3. Restricted scopes apply permitted property IDs to property-linked reads and mutations.
4. Foreign or unknown property IDs are rejected when saving scope (`sanitizeAccessScopeForCompany`).
5. Empty restricted scope returns no property-linked records.
6. Filter composition uses `composePropertyIdFilter` / `composePropertyPrimaryIdFilter` — never duplicate object-key overwrite.
7. SOP/SOW property linking uses `assertPropertyIdsAuthorizedForLink` (atomic reject) and only unlinks in-scope properties.
8. Company-level resources (SOP/SOW templates themselves, integrations catalog, vendor identity) remain company-scoped; property-linked workloads and Property FK mutations remain accessScope-filtered.

### Covered surfaces

Reads: properties, turnovers, issues, QA queue/detail, inventory, dashboard, reports/exports, cleaners list/detail assignments, settings property lists, detail picklists.

Mutations: property profile/settings/calendar, property defaults, turnover create/status/assign/checklist, calendar sync, issue CRUD paths, QA actions, cleaner assignment, **SOP/SOW property link/unlink**.

## Source-derived authorization audit

Inventory is generated from the repository source (not hand-maintained totals):

```bash
npm run audit:authorization:build   # regenerate CSV + classifications JSON
npm run audit:authorization         # fail CI if discovery ≠ audit
```

Discovery uses TypeScript-aware export regexes (`scripts/authorization/discover.ts`). Limitations: no re-export resolution; does not prove behavioral correctness — only inventory coverage. Human classification + security tests prove behavior.

Authoritative file: `docs/audits/tenant-isolation.csv`

Merge readiness requires **zero Unresolved** rows after mechanical recount from that CSV.
