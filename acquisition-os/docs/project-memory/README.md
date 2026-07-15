# Project Memory — Customer Acquisition OS

Permanent institutional memory for engineering execution.

## Law

1. Every completed sprint **must** produce a memory file under `sprints/`.
2. Every new sprint **must** review the previous sprint memory before implementation begins.
3. Memory records **what happened** — it does not change the Product Constitution or reinvent strategy.
4. Speculative plans do not belong here; only decisions and outcomes after work lands.

## Layout

```
docs/project-memory/
  README.md                 # this file
  WORKFLOW.md               # engineering integration
  TEMPLATE.md               # required fields
  INDEX.md                  # chronologic index
  sprints/
    S00-foundation.md       # Sprint 0
    SNN-….md
```

## Who writes memory

| Role | Responsibility |
|---|---|
| **Technical Writer** | Owns final memory file quality |
| **TPM / EM** | Ensures memory exists before sprint close |
| **Sprint Owner leads** | Supply Files / ADRs / Tests / Risks |
| **CTO** | Approves ADRs section accuracy |

## Review gate

Sprint N+1 Definition of Ready includes:

- [ ] Read `sprints/` latest memory  
- [ ] Open blockers reviewed  
- [ ] Tech debt items considered in backlog  

## Creating a new sprint memory

```bash
cd acquisition-os
npm run memory:new -- 1 "auth-sessions"
```

Then fill every section. Incomplete memory = sprint not closed.
