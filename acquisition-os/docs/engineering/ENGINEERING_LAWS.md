# Engineering Laws

**Status:** Binding — Engineering Constitution  
**Authority:** [Engineering Constitution](./ENGINEERING_CONSTITUTION.md) · [ADR 0007](./adr/0007-sprint-governance.md)  
**Effective:** 2026-07-15  

This file is the **authoritative source for sprint governance** and other Engineering Laws.  
Operational docs ([Sprint Playbook](./SPRINT_PLAYBOOK.md), [WORKFLOW](../project-memory/WORKFLOW.md), [ORGANIZATION](./ORGANIZATION.md)) **must reference this file** — they must not fork conflicting rules.

Supersession: only an **approved ADR** may amend or repeal a law in this registry. Informal prompts cannot waive these rules.

---

## Registry

| Law | Title | Status |
|---|---|---|
| **001** | Sprint Governance | **In force** |

---

# ENGINEERING LAW 001 — Sprint Governance

## Mission

No sprint may begin until the previous sprint has been formally reviewed, accepted, documented, and closed.

Engineering quality is more important than engineering speed.

We optimize for long-term product quality, not velocity.

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

## Sprint closure requirements

Before a sprint may be marked **COMPLETE**, verify (also enforced by the [sprint-close checklist](./checklists/SPRINT_CLOSE_CHECKLIST.md) + `npm run governance:close`):

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
| Pre-sprint checklist was completed for this sprint | |
| Sprint-close checklist fully checked | |

If **ANY** item is incomplete: **Sprint status remains OPEN.**

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

## Next sprint readiness

Sprint **N+1** may not begin until **ALL** of the following are complete (also enforced by the [pre-sprint checklist](./checklists/PRE_SPRINT_CHECKLIST.md) + `npm run governance:pre-sprint`):

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
| Pre-sprint checklist for N+1 fully checked | |

If any requirement is missing:

**STOP.**  
Do not implement code.  
Explain why Sprint N+1 cannot begin.

## Operating principle

- Never optimize for speed at the expense of quality.  
- Never sacrifice architecture for velocity.  
- Never skip documentation.  
- Never skip review.  
- Never skip testing.  

Every sprint should leave the product in a healthier state than it began.

## Required reads before any sprint implementation

Every future sprint must begin by reviewing:

1. Product Constitution  
2. Engineering Architecture  
3. Previous Sprint Memory  
4. Previous Sprint Retrospective  
5. Open ADRs  
6. Open Technical Debt  
7. Current Sprint Goals  
8. This file (`ENGINEERING_LAWS.md`)  

Only after these reviews — **and** a green `npm run governance:pre-sprint -- <N>` — may implementation begin.

## Automated checklist enforcement

| Gate | Command | Effect |
|---|---|---|
| Pre-sprint | `npm run governance:pre-sprint -- <N>` | Fails unless prior sprint is COMPLETE (when N>0) and `checklists/sprints/SNN-pre-sprint.md` has all items `[x]` |
| Sprint close | `npm run governance:close -- <N>` | Fails unless `checklists/sprints/SNN-close.md` has all items `[x]` **and** required artifacts exist; only then may status become COMPLETE |

Marking a sprint **COMPLETE** in INDEX/memory **without** a successful `governance:close` is a Law 001 violation.

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

## Application snapshot

- **Sprint 0:** COMPLETE (foundation).  
- **Sprint 1 (Authentication):** **COMPLETE** — PR #24 merged 2026-07-15; debt #19–#22 open.  
- **Sprint 2+:** Readiness may proceed via `governance:pre-sprint`; **implementation requires explicit approval after readiness.**
