# Engineering Constitution — Customer Acquisition OS

**Version:** 1.0.0-eng  
**Status:** Binding  
**Relationship:** Sister instrument to the Product Constitution. Product scope lives in the Product Constitution; **how engineering executes** lives here.

## 1. Purpose

This Engineering Constitution binds the engineering organization to quality-first delivery. It incorporates Engineering Laws by reference and forbids trading architecture, review, testing, or documentation for velocity.

## 2. Engineering Laws (authoritative)

**Sprint governance and other Engineering Laws are defined exclusively in:**

### → [`ENGINEERING_LAWS.md`](./ENGINEERING_LAWS.md)

All roles, workflows, playbooks, agents, and implementation prompts **must** treat `ENGINEERING_LAWS.md` as the authoritative source for sprint governance. Derivative docs may summarize; they **must not** contradict it.

Amendments: **approved ADR only** (see ADR 0007 for Law 001 ratification).

## 3. Hierarchy of authority

1. Product Constitution (product scope, vocabulary, RBAC intent)  
2. **This Engineering Constitution** + **`ENGINEERING_LAWS.md`** (execution rules)  
3. Accepted ADRs  
4. Engineering Architecture  
5. Engineering Execution Plan / Sprint Playbook (timeboxes; cannot waive laws)  
6. Implementation prompts (lowest — overridden by laws)

## 4. Non-negotiable operating principles

- Never optimize for speed at the expense of quality.  
- Never sacrifice architecture for velocity.  
- Never skip documentation, review, or testing.  
- No sprint N+1 without prior sprint COMPLETE under Law 001.  
- No undocumented technical debt at merge.  

## 5. Role compliance

Roles and must-nots: [`ORGANIZATION.md`](./ORGANIZATION.md).  
Day-to-day sequence: [`SPRINT_PLAYBOOK.md`](./SPRINT_PLAYBOOK.md).  
Memory workflow: [`../project-memory/WORKFLOW.md`](../project-memory/WORKFLOW.md).

## 6. Enforcement

- Pre-sprint: `npm run governance:pre-sprint -- <N>`  
- Sprint close → COMPLETE: `npm run governance:close -- <N>`  

Failed validation ⇒ **STOP**. Do not implement / do not mark COMPLETE.
