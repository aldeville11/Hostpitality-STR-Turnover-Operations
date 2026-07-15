# Sprint 2 Coverage Report

**Date:** 2026-07-15  
**Command:** `npm run test:coverage -w @acquisition-os/api`  
**Result:** 23/23 tests passed  

| Metric | Value |
|---|---|
| Statements | **81.4%** |
| Branches | **69.5%** |
| Functions | **86.3%** |
| Lines | **81.4%** |

## Suite breakdown

| Suite | Tests |
|---|---|
| Auth unit | 9 |
| Auth integration (SQL store) | 4 |
| Tenancy CRUD integration | 1 |
| **Tenant Isolation Suite (mandatory)** | **9** |

HTML report: `apps/api/coverage/` (generated locally/CI; not committed).

## Gaps (accepted debt)

- `migrate-cli.ts` / `exports.ts` unused in test process
- Some AuthError / revoke membership HTTP paths lightly covered
- Production `pg` Pool path exercised via interface; CI default uses PGlite (same SQL)
