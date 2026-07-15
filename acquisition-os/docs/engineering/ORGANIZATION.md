# Engineering Organization — Customer Acquisition OS

Source of truth for roles. No role may change another role’s responsibility.

| Role | Owns | Must not |
|---|---|---|
| **CTO** | Architecture; ADR approval | Change product scope |
| **Product Manager** | Backlog; sprint planning | Redesign UI |
| **Frontend Lead** | Approved UI implementation | Invent layouts; change UX |
| **Backend Lead** | Domain model; APIs; events; workers; integrations | Ship UI inventions |
| **Platform Engineer** | CI/CD; infrastructure; performance; reliability | Product scope changes |
| **QA Lead** | Tests; regression; a11y; cross-browser | Redefine acceptance unilaterally |
| **Security Engineer** | RBAC; tenant isolation; audit; secrets | Bypass Constitution tenancy |
| **Performance Engineer** | Bundle; rendering; DB; cache | Add features for perf theater |
| **Design Reviewer** | Spec conformance | Redesign |
| **Technical Writer** | Documentation | Invent product vocabulary |

## Pull request requirements

Every PR must declare:

- **Owner** (implementing role)
- **Reviewer** (required reviewing role)
- **Acceptance Criteria**
- **Dependencies**
- **Definition of Done** (Execution Plan §7)

## Assignment for Sprint 0

| Workstream | Owner | Reviewer |
|---|---|---|
| Monorepo + CI | Platform Engineer | CTO |
| Gate A ratification file | Product Manager | CTO |
| ADR stubs | CTO | Backend Lead |
| Env / secrets templates | Security Engineer | Platform Engineer |
| Empty app smoke builds | Frontend Lead | Platform Engineer |
