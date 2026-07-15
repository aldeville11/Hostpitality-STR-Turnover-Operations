# ENGINEERING LAW 001 — Sprint Governance

**Status:** Binding — permanent operating rule  
**Authority:** Engineering Constitution (ratified by [ADR 0007](./adr/0007-sprint-governance.md))  
**Effective:** 2026-07-15  
**Supersession:** Only by an approved Architecture Decision Record (ADR)

This rule **overrides all future implementation prompts** unless explicitly amended through an approved ADR.

---

## Mission

No sprint may begin until the previous sprint has been formally reviewed, accepted, documented, and closed.

Engineering quality is more important than engineering speed.

We optimize for long-term product quality, not velocity.

---

## Mandatory sprint lifecycle

Every sprint must follow this **exact** sequence. **No steps may be skipped.**

1. Sprint Planning  
2. Implementation  
3. Automated Testing  
4. QA Review  
5. Security Review  
6. Accessibility Review  
7. Performance Review  
8. Architecture Review  
9. Product Review  
10. Documentation Update  
11. Project Memory Update  
12. Sprint Retrospective  
13. Merge Approval  
14. Sprint Closure  
15. Sprint Readiness Review  
16. Next Sprint Authorization  

---

## Sprint closure requirements

Before a sprint may be marked **COMPLETE**, verify:

| Requirement | Met? |
|---|---|
| Sprint objectives completed | |
| Acceptance criteria satisfied | |
| Definition of Done verified | |
| CI passing | |
| Unit tests passing | |
| Integration tests passing | |
| Accessibility verification complete | |
| Security review complete | |
| Performance review complete | |
| Documentation updated | |
| ADRs updated | |
| Technical debt documented | |
| Risks documented | |
| Blockers documented | |
| Sprint memory completed | |
| Pull Request reviewed | |
| Merge approved | |

If **ANY** item is incomplete: **Sprint status remains OPEN.**

---

## Mandatory sprint retrospective

Every sprint must conclude with a retrospective including:

- What went well  
- What slowed us down  
- Unexpected discoveries  
- Architecture concerns  
- Technical debt introduced  
- Engineering lessons  
- Product lessons  
- Documentation improvements  
- Recommended process improvements  
- Risks for next sprint  
- Actions to carry forward  

Template: [`RETROSPECTIVE_TEMPLATE.md`](./RETROSPECTIVE_TEMPLATE.md)

---

## Project memory update

Before sprint closure, update `docs/project-memory/` including:

- Sprint Summary  
- Objectives Completed  
- Files Created / Modified  
- Tests Added  
- Documentation Updated  
- ADRs Added  
- Engineering Decisions / Product Decisions  
- Technical Debt  
- Performance Notes / Security Notes  
- Lessons Learned  
- Remaining Risks  
- Recommended Next Sprint  
- Sprint Status  

See [`../project-memory/WORKFLOW.md`](../project-memory/WORKFLOW.md) and [`../project-memory/TEMPLATE.md`](../project-memory/TEMPLATE.md).

---

## Sprint review scorecard

Score each category **1–10**. Template: [`SPRINT_SCORECARD_TEMPLATE.md`](./SPRINT_SCORECARD_TEMPLATE.md)

| Category | Score |
|---|---|
| Architecture | |
| Engineering Quality | |
| Security | |
| Accessibility | |
| Performance | |
| Testing | |
| Documentation | |
| Product Alignment | |
| Constitution Compliance | |
| Maintainability | |
| **Overall Sprint Score** | |

---

## Merge gate

Before merge, verify:

- Scope remained within sprint boundaries  
- No unauthorized features  
- No Constitution violations  
- No UX deviations  
- No Design System violations  
- No architectural shortcuts  
- No undocumented technical debt  
- No failing tests  

If violations exist: **Reject merge.**

---

## Next sprint readiness

Sprint **N+1** may not begin until **ALL** of the following are complete:

| Requirement | Met? |
|---|---|
| Previous sprint formally approved | |
| Sprint memory published | |
| Retrospective completed | |
| Merge completed | |
| ADRs synchronized | |
| Documentation synchronized | |
| Open blockers reviewed | |
| Technical debt prioritized | |
| Product Manager authorizes next sprint | |
| CTO authorizes next sprint | |

If any requirement is missing:

**STOP.**  
Do not implement code.  
Explain why Sprint N+1 cannot begin.

---

## Operating principle

- Never optimize for speed at the expense of quality.  
- Never sacrifice architecture for velocity.  
- Never skip documentation.  
- Never skip review.  
- Never skip testing.  

Every sprint should leave the product in a healthier state than it began.

---

## Required reads before any sprint implementation

Every future sprint must begin by reviewing:

1. Product Constitution  
2. Engineering Architecture  
3. Previous Sprint Memory  
4. Previous Sprint Retrospective  
5. Open ADRs  
6. Open Technical Debt  
7. Current Sprint Goals  

Only after these reviews may implementation begin.

---

## Role obligations

| Role | Obligation under this law |
|---|---|
| **CTO** | Final merge approval; next-sprint authorization; ADR supersession only |
| **Product Manager** | Sprint planning; product review; next-sprint authorization |
| **QA Lead** | Automated testing gate; QA review; a11y coordination |
| **Security Engineer** | Security review gate |
| **Performance Engineer** | Performance review gate |
| **Design Reviewer** | Accessibility / Design System merge-gate input |
| **Technical Architect / Staff Architect** | Architecture review gate |
| **Technical Writer** | Documentation + project memory before closure |
| **All implementers** | Refuse to start N+1 if readiness incomplete |

---

## Current application (as of ratification)

- **Sprint 0:** Closed (historical foundation).  
- **Sprint 1 (Authentication):** **OPEN** — implementaton delivered; ERB verdict was *Approve with Required Changes*; merge not completed; formal closure incomplete under this law.  
- **Sprint 2+:** **NOT AUTHORIZED** until Sprint 1 reaches COMPLETE under this lifecycle.
