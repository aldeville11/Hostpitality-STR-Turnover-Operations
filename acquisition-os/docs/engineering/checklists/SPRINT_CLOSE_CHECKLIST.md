# Sprint-close checklist

**Authority:** [`../ENGINEERING_LAWS.md`](../ENGINEERING_LAWS.md) (Law 001)  
**When:** Before Status may become **COMPLETE**  
**Automation:** `npm run governance:close -- <N>`  

> All items must use GitHub-style checkboxes. Only `- [x]` counts as complete. `- [ ]` fails validation.  
> **COMPLETE is forbidden** until this checklist validates and required artifacts exist.

## Instructions

1. Ensure `sprints/SNN-close.md` exists (from `governance:checklist:init`).  
2. Check every box only when true.  
3. Run `npm run governance:close -- <N>`. Exit `0` required before setting INDEX/memory to COMPLETE.

---

# Sprint __ — Close validation

**Sprint number:** __  
**Slug:** __  
**Validator run required:** `npm run governance:close -- <N>`

## Objectives & acceptance

- [ ] Sprint objectives completed
- [ ] Acceptance criteria satisfied
- [ ] Definition of Done verified
- [ ] Scope remained within sprint boundaries (no unauthorized features)

## Quality gates

- [ ] CI passing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Accessibility verification complete
- [ ] Security review complete
- [ ] Performance review complete
- [ ] Architecture review complete
- [ ] Product review complete
- [ ] QA review complete

## Compliance

- [ ] No Constitution violations
- [ ] No UX deviations
- [ ] No Design System violations
- [ ] No architectural shortcuts
- [ ] No undocumented technical debt (issues/ADRs linked)

## Documentation & memory

- [ ] Documentation updated
- [ ] ADRs updated / synchronized
- [ ] Technical debt documented
- [ ] Risks documented
- [ ] Blockers documented
- [ ] Sprint memory completed (`docs/project-memory/sprints/SNN-*.md`)
- [ ] Project memory INDEX updated
- [ ] Retrospective published
- [ ] Scorecard published

## Merge & closure

- [ ] Pull Request reviewed
- [ ] Merge approved
- [ ] Merge completed (or explicitly N/A only if CTO records exception ADR — default: required)
- [ ] Pre-sprint checklist for this sprint was validated earlier
- [ ] Ready for Sprint Readiness Review / N+1 authorization process
