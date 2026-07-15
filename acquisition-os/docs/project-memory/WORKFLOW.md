# Sprint lifecycle & project memory workflow

**Authoritative sprint governance:** [`ENGINEERING_LAWS.md`](../engineering/ENGINEERING_LAWS.md)  
**Engineering Constitution:** [`ENGINEERING_CONSTITUTION.md`](../engineering/ENGINEERING_CONSTITUTION.md)  
**Playbook:** [`SPRINT_PLAYBOOK.md`](../engineering/SPRINT_PLAYBOOK.md)  
**ADR:** [0007](../engineering/adr/0007-sprint-governance.md)

This workflow **implements** the laws — it does not redefine them. On conflict, `ENGINEERING_LAWS.md` wins.

## Mandatory sequence (no skips)

```
1  Sprint Planning
2  Implementation
3  Automated Testing
4  QA Review
5  Security Review
6  Accessibility Review
7  Performance Review
8  Architecture Review
9  Product Review
10 Documentation Update
11 Project Memory Update
12 Sprint Retrospective
13 Merge Approval
14 Sprint Closure
15 Sprint Readiness Review
16 Next Sprint Authorization
```

## Status values

| Status | Meaning |
|---|---|
| `Draft` | Memory scaffolding in progress |
| `OPEN` | Work delivered and/or under review; **closure incomplete** |
| `COMPLETE` | All Law 001 closure requirements met **and** `npm run governance:close -- <N>` passed |

If any closure item is incomplete → status remains **OPEN**.

## Automated gates (required)

| Gate | Command | Blocks |
|---|---|---|
| Pre-sprint | `npm run governance:pre-sprint -- <N>` | Implementation of Sprint N |
| Sprint close | `npm run governance:close -- <N>` | Transition to **COMPLETE** |

Checklist templates:

- [`../engineering/checklists/PRE_SPRINT_CHECKLIST.md`](../engineering/checklists/PRE_SPRINT_CHECKLIST.md)  
- [`../engineering/checklists/SPRINT_CLOSE_CHECKLIST.md`](../engineering/checklists/SPRINT_CLOSE_CHECKLIST.md)  

Init per sprint:

```bash
npm run governance:checklist:init -- <N> <slug>
```

## Before Sprint N+1 implementation

1. Complete prior sprint under Law 001 (COMPLETE + merge).  
2. Fill and validate pre-sprint checklist (`governance:pre-sprint`).  
3. Review Product Constitution, Architecture, prior memory/retrospective, open ADRs, debt, goals.  
4. Obtain **Product Manager** and **CTO** authorization.  

If any readiness item is missing: **STOP. Do not implement code.** Explain the blocker.

## Pull request checklist

Every sprint-closing PR must:

1. Add/update `docs/project-memory/sprints/SNN-*.md` (all sections)  
2. Update `docs/project-memory/INDEX.md`  
3. Publish retrospective (`docs/engineering/retrospectives/SNN-retrospective.md`)  
4. Publish scorecard (`docs/engineering/scorecards/SNN-scorecard.md`)  
5. Complete `checklists/sprints/SNN-close.md` and pass `governance:close`  
6. Link memory + retrospective + scorecard + debt issues in the PR body  
7. Declare Owner / Reviewer / AC / Dependencies / Definition of Done  

## Forbidden

- Closing a sprint without memory, retrospective, scorecard, or green `governance:close`  
- Starting Sprint N+1 without COMPLETE prior sprint + green `governance:pre-sprint` + authorizations  
- Using memory to redefine product scope (amend Product Constitution instead)  
- Recording secrets, API keys, or customer PII in memory  
- Merging with undocumented technical debt  

## Automation

```bash
npm run memory:new -- <number> <slug>
npm run governance:checklist:init -- <number> <slug>
npm run governance:pre-sprint -- <number>
npm run governance:close -- <number>
```
