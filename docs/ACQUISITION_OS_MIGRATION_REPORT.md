# Migration report — Acquisition OS extraction

**Date:** 2026-07-15  
**Status:** Complete (code pushed by repo owner; Hostpitality nesting removed)

## Repository URL
https://github.com/aldeville11/acquisition-os

## Default branch
`main`

## Remote configuration
```
origin  https://github.com/aldeville11/acquisition-os.git
```

## Files moved
Entire former nested tree `acquisition-os/` (apps, packages, docs, scripts, package.json, lockfile, AGENTS.md, README, .env.example, .gitignore) committed to the standalone repo as:

- Commit message: `Initial import: Acquisition OS standalone (Sprint 2 COMPLETE)`
- Approx. SHA on GitHub: `cb09dab` (verify on GitHub commits page)

## Files / config removed from Hostpitality
- `acquisition-os/` (nested project deleted)
- `.github/workflows/acquisition-os-ci.yml`
- `tsconfig.json` exclude entry for `acquisition-os`

## Files added to Hostpitality
- `docs/ACQUISITION_OS_MOVED.md`
- `docs/ACQUISITION_OS_MIGRATION_REPORT.md`
- README pointer to the new repository

## Issues encountered
1. Cloud Agent `cursor[bot]` could not create/push to `acquisition-os` (installation scoped to Hostpitality only) — owner pushed from local Windows machine after authenticating.
2. Standalone CI (`.github/workflows/ci.yml`) was not in the owner’s first push — must be added in the Acquisition OS repository (see follow-up below).

## Verification results
| Check | Result |
|---|---|
| GitHub repo accessible | Yes — https://github.com/aldeville11/acquisition-os |
| Default branch | `main` |
| Code present (`apps`, `docs`, `packages`, …) | Yes |
| Nested `acquisition-os/` removed from Hostpitality | Yes (this PR) |
| Hostpitality AOS CI removed | Yes (this PR) |

## Follow-up (Acquisition OS repo)
Add `.github/workflows/ci.yml` with `npm run verify`, mandatory `test:isolation`, and coverage — mirroring former Hostpitality `acquisition-os-ci.yml` but with repo-root paths.
