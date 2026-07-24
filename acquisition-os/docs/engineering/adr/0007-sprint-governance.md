# ADR 0007: Mandatory sprint governance (Engineering Law 001)

## Status
**Accepted** — 2026-07-15  
**Sign-off:** CTO · Product Manager · Staff Software Architect  

## Context
Implementation prompts historically risk skipping review, memory, merge hygiene, or starting the next sprint before the prior sprint is formally closed. Long-term product quality requires a binding sequence that no role may shortcut for velocity.

## Decision
Adopt **Engineering Law 001 — Sprint Governance** as a permanent part of the Engineering Constitution.

- **Authoritative text:** [`../ENGINEERING_LAWS.md`](../ENGINEERING_LAWS.md)
- Engineering Constitution: [`../ENGINEERING_CONSTITUTION.md`](../ENGINEERING_CONSTITUTION.md)
- Sprint Playbook (operator guide): [`../SPRINT_PLAYBOOK.md`](../SPRINT_PLAYBOOK.md)
- The 16-step sprint lifecycle is mandatory; no steps may be skipped
- A sprint remains **OPEN** until all closure requirements are met (including merge approved)
- Sprint N+1 may not begin without readiness + PM + CTO authorization
- Pre-sprint and sprint-close checklists are mandatory and **machine-validated** (`npm run governance:pre-sprint` / `governance:close`) before COMPLETE
- This ADR and `ENGINEERING_LAWS.md` **override future implementation prompts** that conflict with governance
- Supersession requires a **new approved ADR** only — informal chat instructions cannot waive the law

## Consequences
- Agents and humans must STOP and explain blockers rather than start unauthorized sprints
- Sprint 1 remains OPEN until merge gate + checklist closure under Law 001
- Project memory templates and organization docs must reference `ENGINEERING_LAWS.md`
- Quality over speed is an enforceable operating constraint, not aspirational guidance

## Non-goals
- Does not change Product Constitution vocabulary or Gate A strategy locks
- Does not expand Sprint 1 product scope
- Does not authorize Sprint 2
