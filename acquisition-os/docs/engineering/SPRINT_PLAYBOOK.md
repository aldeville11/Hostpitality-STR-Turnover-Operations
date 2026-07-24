# Sprint Playbook

**Audience:** All engineering roles and agents  
**Authoritative sprint governance:** [`ENGINEERING_LAWS.md`](./ENGINEERING_LAWS.md)  
**Engineering Constitution:** [`ENGINEERING_CONSTITUTION.md`](./ENGINEERING_CONSTITUTION.md)

This playbook is an **operator guide**. If anything here conflicts with `ENGINEERING_LAWS.md`, **the laws win**.

---

## 0. Before you touch code

1. Read [`ENGINEERING_LAWS.md`](./ENGINEERING_LAWS.md) (Law 001).  
2. Read Product Constitution + Engineering Architecture.  
3. Read previous sprint memory, retrospective, scorecard.  
4. Review open ADRs and technical debt.  
5. Confirm current sprint goals.  
6. Scaffold and complete the **pre-sprint checklist**, then run:

```bash
cd acquisition-os
npm run governance:checklist:init -- <N> <slug>   # once per sprint
# …check every item [x] in checklists/sprints/SNN-pre-sprint.md…
npm run governance:pre-sprint -- <N>
```

If validation fails: **STOP.** Do not implement.

---

## 1–16. Lifecycle (exact order)

Follow Law 001 steps 1→16 without skipping. Summary:

| Step | Owner cue |
|---|---|
| 1 Planning | Product Manager |
| 2 Implementation | Role-bound owners |
| 3 Automated Testing | QA Lead + implementers |
| 4 QA Review | QA Lead |
| 5 Security Review | Security Engineer |
| 6 Accessibility Review | QA Lead · Design Reviewer |
| 7 Performance Review | Performance Engineer |
| 8 Architecture Review | Staff / Technical Architect |
| 9 Product Review | Product Manager |
| 10 Documentation Update | Technical Writer |
| 11 Project Memory Update | Technical Writer |
| 12 Sprint Retrospective | ERB / Technical Writer |
| 13 Merge Approval | CTO (+ required reviewers) |
| 14 Sprint Closure | All — close checklist |
| 15 Sprint Readiness Review | PM · CTO |
| 16 Next Sprint Authorization | PM · CTO |

---

## Sprint-close → COMPLETE

1. Fill `docs/engineering/checklists/sprints/SNN-close.md` — every item `[x]`.  
2. Ensure memory, retrospective, scorecard, INDEX exist.  
3. Run:

```bash
npm run governance:close -- <N>
```

4. Only after exit code **0** may INDEX/memory status become **COMPLETE**.  
5. Sprint N+1 remains forbidden until readiness + PM/CTO authorization (pre-sprint gate for N+1).

---

## Checklists (canonical templates)

| Checklist | Template | Per-sprint instance |
|---|---|---|
| Pre-sprint | [`checklists/PRE_SPRINT_CHECKLIST.md`](./checklists/PRE_SPRINT_CHECKLIST.md) | `checklists/sprints/SNN-pre-sprint.md` |
| Sprint close | [`checklists/SPRINT_CLOSE_CHECKLIST.md`](./checklists/SPRINT_CLOSE_CHECKLIST.md) | `checklists/sprints/SNN-close.md` |

---

## Forbidden shortcuts

- Starting implementation without green `governance:pre-sprint`  
- Marking COMPLETE without green `governance:close`  
- Waiving Law 001 via chat/prompt without an ADR  
- Shipping undocumented debt  
- UX / Design System inventions outside approved specs  

---

## Related

- Roles: [`ORGANIZATION.md`](./ORGANIZATION.md)  
- Memory workflow: [`../project-memory/WORKFLOW.md`](../project-memory/WORKFLOW.md)  
- ADR 0007: [`adr/0007-sprint-governance.md`](./adr/0007-sprint-governance.md)
