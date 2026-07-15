# Engineering Organization — Customer Acquisition OS

Source of truth for roles. No role may change another role’s responsibility.

**Sprint governance (binding):** [Engineering Law 001](./ENGINEERING_LAW_001_SPRINT_GOVERNANCE.md) · [ADR 0007](./adr/0007-sprint-governance.md)

| Role | Owns | Must not |
|---|---|---|
| **CTO** | Architecture; ADR approval; Law 001 merge + Sprint N+1 authorization | Change product scope; waive Law 001 without ADR |
| **Product Manager** | Backlog; sprint planning; Law 001 product review + Sprint N+1 authorization | Redesign UI; authorize N+1 if prior sprint OPEN |
| **Frontend Lead** | Approved UI implementation | Invent layouts; change UX |
| **Backend Lead** | Domain model; APIs; events; workers; integrations | Ship UI inventions |
| **Platform Engineer** | CI/CD; infrastructure; performance; reliability | Product scope changes |
| **QA Lead** | Tests; regression; a11y; Law 001 QA/accessibility gates | Redefine acceptance unilaterally |
| **Security Engineer** | RBAC; tenant isolation; audit; secrets; Law 001 security review | Bypass Constitution tenancy |
| **Performance Engineer** | Bundle; rendering; DB; cache; Law 001 performance review | Add features for perf theater |
| **Design Reviewer** | Spec conformance; Design System merge-gate input | Redesign |
| **Technical Writer** | Documentation; project memory; retrospective publish | Invent product vocabulary |
| **Staff / Technical Architect** | Architecture review gate (Law 001) | Authorize undocumented shortcuts |

## Pull request requirements

Every PR must declare:

- **Owner** (implementing role)
- **Reviewer** (required reviewing role)
- **Acceptance Criteria**
- **Dependencies**
- **Definition of Done** (Execution Plan §7)

Sprint-closing PRs additionally require Law 001 artifacts (memory, retrospective, scorecard, debt issue links). See `docs/project-memory/WORKFLOW.md`.

## Project memory (required)

Institutional memory lives in `docs/project-memory/`.

1. **Before Sprint N+1 starts:** complete Law 001 readiness + review previous memory/retrospective.  
2. **Before Sprint N closes:** publish memory (all sections), retrospective, scorecard; update `INDEX.md`; merge approved.  
3. Scaffold: `npm run memory:new -- <number> <slug>`

Memory does not change product scope — amend the Constitution for that.

## Assignment for Sprint 0

| Workstream | Owner | Reviewer |
|---|---|---|
| Monorepo + CI | Platform Engineer | CTO |
| Gate A ratification file | Product Manager | CTO |
| ADR stubs | CTO | Backend Lead |
| Env / secrets templates | Security Engineer | Platform Engineer |
| Empty app smoke builds | Frontend Lead | Platform Engineer |
