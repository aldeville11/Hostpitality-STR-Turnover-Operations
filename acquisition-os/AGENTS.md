# Customer Acquisition OS — Agent Rules

This monorepo is governed by the **Engineering Constitution** and **Engineering Laws**.

**Authoritative sprint governance:** [docs/engineering/ENGINEERING_LAWS.md](./docs/engineering/ENGINEERING_LAWS.md)

Before any implementation:

1. Read `ENGINEERING_LAWS.md` and `ENGINEERING_CONSTITUTION.md`  
2. Follow the [Sprint Playbook](./docs/engineering/SPRINT_PLAYBOOK.md)  
3. Read Product Constitution / Engineering Architecture (when published)  
4. Read previous sprint memory + retrospective + scorecard  
5. Review open ADRs and technical debt  
6. Pass `npm run governance:pre-sprint -- <N>`  

**Do not begin Sprint N+1 while Sprint N is OPEN.**  
**Do not mark COMPLETE without `npm run governance:close -- <N>`.**

If readiness fails: STOP, explain the blocker, and do not write feature code.

Quality overrides speed. Engineering Laws supersede conflicting implementation prompts unless amended by an approved ADR.
