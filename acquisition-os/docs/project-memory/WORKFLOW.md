# Project Memory — Engineering Workflow Integration

## Sprint lifecycle

```
Previous memory review
        ↓
Sprint planning (PM) — backlog only
        ↓
Implementation (role-bound)
        ↓
PR (Owner / Reviewer / AC / Deps / DoD)
        ↓
Verify + Demo
        ↓
Write sprint memory (required)
        ↓
INDEX.md update
        ↓
Sprint closed
```

## Pull request checklist (addendum)

In addition to ORGANIZATION.md PR fields, every sprint-closing PR must:

1. Add or update `docs/project-memory/sprints/SNN-*.md`
2. Update `docs/project-memory/INDEX.md`
3. Link the memory file in the PR description

Feature PRs during a sprint may omit a full memory file; the **sprint-close PR** may not.

## Forbidden

- Closing a sprint without memory
- Starting Sprint N+1 without reading Sprint N memory
- Using memory files to redefine product scope (amend Constitution instead)
- Recording secrets, API keys, or customer PII in memory

## Cadence

| Event | Memory action |
|---|---|
| Sprint start | Read previous memory in planning |
| Mid-sprint ADR | Note ID; full write-up at sprint close |
| Sprint demo (Fri) | Draft Objectives Completed |
| Sprint close | Publish memory + INDEX |

## Automation

`npm run memory:new -- <number> <slug>` scaffolds the next file from `TEMPLATE.md`.
