# Sprint lifecycle & project memory workflow

Normative authority: **[Engineering Law 001](../engineering/ENGINEERING_LAW_001_SPRINT_GOVERNANCE.md)** ([ADR 0007](../engineering/adr/0007-sprint-governance.md)).

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
| `COMPLETE` | All Law 001 closure requirements met (including merge approved) |

If any closure item is incomplete → status remains **OPEN**.

## Before Sprint N+1 implementation

Review **all** of:

1. Product Constitution  
2. Engineering Architecture  
3. Previous Sprint Memory  
4. Previous Sprint Retrospective  
5. Open ADRs  
6. Open Technical Debt  
7. Current Sprint Goals  

Then obtain **Product Manager** and **CTO** authorization.  

If any readiness item is missing: **STOP. Do not implement code.** Explain the blocker.

## Pull request checklist

Every sprint-closing PR must:

1. Add/update `docs/project-memory/sprints/SNN-*.md` (all sections)  
2. Update `docs/project-memory/INDEX.md`  
3. Publish retrospective (`docs/engineering/retrospectives/SNN-retrospective.md`)  
4. Publish scorecard (`docs/engineering/scorecards/SNN-scorecard.md`)  
5. Link memory + retrospective + scorecard + debt issues in the PR body  
6. Declare Owner / Reviewer / AC / Dependencies / Definition of Done  

## Forbidden

- Closing a sprint without memory, retrospective, or scorecard  
- Starting Sprint N+1 without COMPLETE prior sprint + authorizations  
- Using memory to redefine product scope (amend Constitution instead)  
- Recording secrets, API keys, or customer PII in memory  
- Merging with undocumented technical debt  

## Automation

`npm run memory:new -- <number> <slug>` scaffolds the next memory file from `TEMPLATE.md`.
