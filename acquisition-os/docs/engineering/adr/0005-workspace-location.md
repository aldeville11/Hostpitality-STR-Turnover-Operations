# ADR 0005: Workspace ↔ Location model

## Status
**Accepted** — 2026-07-15  
**Sign-off:** Backend Lead · Product Manager · CTO

## Context
Constitution allows one Workspace spanning many Locations, or one Workspace per region. Leaving this undecided causes multi-location model thrash (Execution Plan risk R9) before Membership CRUD.

## Options
1. **Preferred P0:** One Workspace per Organization with Location filters (`location_ids[]` / membership `location_scope[]`)  
2. Workspace-per-Location as the only model (rejected for P0 — multiplies command centers and memberships)  
3. Defer entirely (rejected — blocks Sprint 2 Membership)

## Decision
**Option 1 — P0 default** (aligned with Constitution Part 3):

| Pattern | Model |
|---|---|
| Single-location | 1 Organization · 1 Location · 1 Workspace |
| Multi-location | 1 Organization · N Locations · **1 Workspace** with Location filters |
| Enterprise rollup | Optional HQ Workspace later (**P1** — out of Sprint 2) |

Implications for Sprint 2:
- `workspaces.location_ids` (or `workspace_locations` join) is the Workspace↔Location binding
- Membership uses `location_scope[]` within the Workspace’s Locations (empty/null means all Workspace locations unless product says otherwise — default: **all Workspace locations** when scope empty)
- Do not ship Workspace-per-Location as the default provisioning path in S2

## Consequences
- Admin CRUD creates Workspace against an Organization and attaches Locations
- AuthContext may populate `organizationId`, `workspaceId`, `locationScope` from Membership without implying RBAC enforcement (Sprint 3)
- Franchise / PE / multi-Workspace enterprise remains P1+

## Non-goals
- RBAC capability matrix enforcement (Sprint 3)
- HQ rollup Workspace (P1)
- Changing frozen vocabulary (Workspace ≠ Account/Project)
