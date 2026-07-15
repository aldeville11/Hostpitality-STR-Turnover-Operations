# Project Memory — Customer Acquisition OS

Permanent institutional memory for engineering execution.

**Binding governance:** [ENGINEERING_LAWS.md](../engineering/ENGINEERING_LAWS.md) ([Engineering Constitution](../engineering/ENGINEERING_CONSTITUTION.md) · [ADR 0007](../engineering/adr/0007-sprint-governance.md)).

## Law

1. Every sprint must produce a memory file under `sprints/` before closure.  
2. Status is `Draft` | `OPEN` | `COMPLETE` — **COMPLETE** only when Law 001 closure (including merge) is satisfied.  
3. Every new sprint must review previous memory + retrospective + scorecard before implementation.  
4. Sprint N+1 is forbidden until prior sprint COMPLETE and PM + CTO authorize.  
5. Memory records **what happened** — it does not change the Product Constitution or reinvent strategy.  
6. Speculative plans do not belong here; only decisions and outcomes after work lands.  
7. Technical debt requires tracking links (issues/ADRs) — undocumented debt fails the merge gate.

## Layout

```
docs/project-memory/
  README.md
  WORKFLOW.md
  TEMPLATE.md
  INDEX.md
  sprints/
    S00-foundation.md
    S01-auth-sessions.md
```

Companion Law 001 artifacts:

```
docs/engineering/retrospectives/SNN-retrospective.md
docs/engineering/scorecards/SNN-scorecard.md
```

## Who writes memory

| Role | Responsibility |
|---|---|
| **Technical Writer** | Owns final memory file quality |
| **TPM / EM** | Ensures memory exists before sprint close |
| **Sprint Owner leads** | Supply Files / ADRs / Tests / Risks |
| **CTO** | Approves ADRs section accuracy; Law 001 merge + N+1 auth |

## Review gate (Definition of Ready for N+1)

- [ ] Prior sprint Status = COMPLETE  
- [ ] Read prior memory + retrospective + scorecard  
- [ ] Open blockers reviewed  
- [ ] Tech debt prioritized  
- [ ] Open ADRs reviewed  
- [ ] PM authorizes N+1  
- [ ] CTO authorizes N+1  

If any box is unchecked: **STOP. Do not implement.**

## Creating a new sprint memory

```bash
cd acquisition-os
npm run memory:new -- 1 "auth-sessions"
```

Then fill every section including Law 001 closure checklist. Incomplete memory = sprint remains OPEN.
