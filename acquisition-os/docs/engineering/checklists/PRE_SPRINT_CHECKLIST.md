# Pre-sprint validation checklist

**Authority:** [`../ENGINEERING_LAWS.md`](../ENGINEERING_LAWS.md) (Law 001)  
**When:** Before Sprint **N** implementation begins  
**Automation:** `npm run governance:pre-sprint -- <N>`  

> All items must use GitHub-style checkboxes. Only `- [x]` counts as complete. `- [ ]` fails validation.

## Instructions

1. Copy this template to `sprints/SNN-pre-sprint.md` (or run `npm run governance:checklist:init -- <N> <slug>`).  
2. Replace placeholders; check every box when true.  
3. Run `npm run governance:pre-sprint -- <N>`. Exit `0` required before implementation.

---

# Sprint __ — Pre-sprint validation

**Sprint number:** __  
**Slug:** __  
**Validator run required:** `npm run governance:pre-sprint -- <N>`

## Prior sprint & authorization

- [ ] Previous sprint Status is **COMPLETE** in `docs/project-memory/INDEX.md` (waive only for Sprint 00)
- [ ] Previous sprint memory reviewed
- [ ] Previous sprint retrospective reviewed
- [ ] Previous sprint scorecard reviewed
- [ ] Product Manager authorizes this sprint
- [ ] CTO authorizes this sprint

## Required reads

- [ ] Product Constitution reviewed
- [ ] Engineering Architecture reviewed
- [ ] Engineering Laws (`ENGINEERING_LAWS.md`) reviewed
- [ ] Engineering Constitution reviewed
- [ ] Open ADRs reviewed
- [ ] Open technical debt reviewed and prioritized for this sprint
- [ ] Current sprint goals documented and in-scope only

## Tooling ready

- [ ] Project memory scaffold created (`npm run memory:new` or equivalent)
- [ ] Pre-sprint checklist instance committed under `checklists/sprints/`
- [ ] No intent to implement Sprint N+1 work in this sprint
