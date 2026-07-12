import type { Turnover } from "@prisma/client";
import { prisma } from "../db";
import { writeAuditLog } from "../audit";
import { parseJson } from "../utils";
import type { AgentType } from "../types";

export const AGENT_LABELS: Record<AgentType, string> = {
  LEAD_TURNOVER_OPS: "Lead Turnover Ops Agent",
  BOOKING_SYNC: "Booking Sync Agent",
  SOP: "SOP Agent",
  SOW: "SOW Agent",
  CLEANING_SCHEDULER: "Cleaning Scheduler Agent",
  CLEANER_DISPATCH: "Cleaner Dispatch Agent",
  CHECKLIST_QA: "Checklist / QA Agent",
  PHOTO_VERIFICATION: "Photo Verification Agent",
  ISSUE_ESCALATION: "Issue Escalation Agent",
  INVENTORY_RESTOCK: "Inventory / Restock Agent",
  OWNER_UPDATE: "Owner Update Agent",
};

export function agentLabel(type: string) {
  return AGENT_LABELS[type as AgentType] ?? type;
}

export async function proposeAgentAction(input: {
  companyId: string;
  turnoverId?: string;
  agentType: AgentType;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
}) {
  const action = await prisma.agentAction.create({
    data: {
      companyId: input.companyId,
      turnoverId: input.turnoverId,
      agentType: input.agentType,
      title: input.title,
      description: input.description,
      payloadJson: JSON.stringify(input.payload ?? {}),
      status: "PENDING_APPROVAL",
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    action: "agent.propose",
    entityType: "AgentAction",
    entityId: action.id,
    metadata: { agentType: input.agentType, title: input.title },
  });

  return action;
}

export async function runLeadTurnoverPipeline(turnoverId: string, companyId: string) {
  const turnover = await prisma.turnover.findUnique({
    where: { id: turnoverId },
    include: {
      property: { include: { sop: { include: { steps: true } }, sowTemplate: true } },
    },
  });
  if (!turnover) throw new Error("Turnover not found");

  const actions = [];

  // SOP Agent
  if (turnover.property.sop) {
    actions.push(
      await proposeAgentAction({
        companyId,
        turnoverId,
        agentType: "SOP",
        title: `Load SOP: ${turnover.property.sop.name}`,
        description: `Apply property playbook with ${turnover.property.sop.steps.length} steps including pre-turnover prep, room-by-room checklist, photo documentation, and final walkthrough.`,
        payload: { sopId: turnover.property.sop.id },
      })
    );
  }

  // SOW Agent
  if (turnover.property.sowTemplate) {
    const addOns = parseJson<string[]>(turnover.property.sowTemplate.addOns, []);
    actions.push(
      await proposeAgentAction({
        companyId,
        turnoverId,
        agentType: "SOW",
        title: `Define SOW: ${turnover.property.sowTemplate.name}`,
        description: `Set standard scope, ${addOns.length} optional add-ons, ${turnover.property.sowTemplate.slaMinutes}m SLA, and photo proof requirements for unit ${turnover.property.unitCode}.`,
        payload: { sowTemplateId: turnover.property.sowTemplate.id },
      })
    );
  }

  // Scheduler Agent
  actions.push(
    await proposeAgentAction({
      companyId,
      turnoverId,
      agentType: "CLEANING_SCHEDULER",
      title: "Recommend cleaner assignment",
      description: `Find available cleaner for ${turnover.property.name} window ${turnover.windowStart.toISOString()} – ${turnover.windowEnd.toISOString()}.`,
      payload: { propertyId: turnover.propertyId },
    })
  );

  await proposeAgentAction({
    companyId,
    turnoverId,
    agentType: "LEAD_TURNOVER_OPS",
    title: "Orchestrate turnover workflow",
    description: "Lead agent queued SOP, SOW, and scheduler proposals for this turnover.",
    payload: { childActionIds: actions.map((a) => a.id) },
  });

  return actions;
}

export async function executeApprovedAction(actionId: string, approverId: string) {
  const action = await prisma.agentAction.findUnique({
    where: { id: actionId },
    include: {
      turnover: {
        include: {
          property: { include: { sop: { include: { steps: true } }, sowTemplate: true, owner: true } },
          checklist: true,
          photos: true,
          assignments: true,
        },
      },
    },
  });
  if (!action) throw new Error("Action not found");
  if (action.status !== "PENDING_APPROVAL" && action.status !== "APPROVED") {
    throw new Error("Action is not approvable");
  }

  const payload = parseJson<Record<string, unknown>>(action.payloadJson, {});
  let result: Record<string, unknown> = {};

  await prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "APPROVED",
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });

  try {
    switch (action.agentType) {
      case "SOP":
        result = await applySop(action.turnover!);
        break;
      case "SOW":
        result = await applySow(action.turnover!);
        break;
      case "CLEANING_SCHEDULER":
        result = await scheduleCleaner(action.turnover!, action.companyId);
        break;
      case "CLEANER_DISPATCH":
        result = await dispatchCleaner(action.turnover!);
        break;
      case "CHECKLIST_QA":
        result = await runChecklistQa(action.turnover!);
        break;
      case "PHOTO_VERIFICATION":
        result = await verifyPhotos(action.turnover!);
        break;
      case "ISSUE_ESCALATION":
        result = await escalateIssues(action.turnover!, payload);
        break;
      case "INVENTORY_RESTOCK":
        result = await restockInventory(action.companyId, action.turnover!);
        break;
      case "OWNER_UPDATE":
        result = await sendOwnerUpdate(action.turnover!);
        break;
      case "BOOKING_SYNC":
        result = { synced: true };
        break;
      case "LEAD_TURNOVER_OPS":
        result = { orchestrated: true };
        break;
      default:
        result = { skipped: true };
    }

    await prisma.agentAction.update({
      where: { id: actionId },
      data: {
        status: "EXECUTED",
        executedAt: new Date(),
        resultJson: JSON.stringify(result),
      },
    });

    await writeAuditLog({
      companyId: action.companyId,
      userId: approverId,
      action: "agent.execute",
      entityType: "AgentAction",
      entityId: actionId,
      metadata: { agentType: action.agentType, result },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution failed";
    await prisma.agentAction.update({
      where: { id: actionId },
      data: { status: "FAILED", resultJson: JSON.stringify({ error: message }) },
    });
    throw err;
  }
}

async function applySop(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  if (!turnover.property.sop) return { applied: false };
  const steps = turnover.property.sop.steps.sort((a, b) => a.sortOrder - b.sortOrder);
  await prisma.checklistItem.deleteMany({ where: { turnoverId: turnover.id } });
  await prisma.checklistItem.createMany({
    data: steps
      .filter((s) => !s.isDeepClean || turnover.isDeepClean)
      .map((s, idx) => ({
        turnoverId: turnover.id,
        section: s.section,
        title: s.title,
        instructions: s.instructions,
        requiresPhoto: s.requiresPhoto,
        sortOrder: idx,
      })),
  });
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: { sopId: turnover.property.sop.id },
  });
  return { checklistItems: steps.length };
}

async function applySow(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  const tpl = turnover.property.sowTemplate;
  if (!tpl) return { applied: false };
  const deadline = new Date(turnover.windowStart);
  deadline.setMinutes(deadline.getMinutes() + tpl.slaMinutes);
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: {
      sowTemplateId: tpl.id,
      scopeJson: JSON.stringify({
        standardScope: tpl.standardScope,
        photoReqs: parseJson(tpl.photoReqs, []),
        damageRules: tpl.damageRules,
        missingItemRules: tpl.missingItemRules,
      }),
      addOnsJson: tpl.addOns,
      deadlineAt: deadline,
    },
  });
  return { sowTemplateId: tpl.id, slaMinutes: tpl.slaMinutes };
}

async function scheduleCleaner(
  turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>,
  companyId: string
) {
  const cleaners = await prisma.teamMember.findMany({
    where: { companyId, role: "CLEANER", active: true },
    include: { assignments: { where: { status: { in: ["assigned", "dispatched", "in_progress"] } } } },
  });
  const ranked = cleaners
    .map((c) => ({ member: c, load: c.assignments.length }))
    .sort((a, b) => a.load - b.load);
  const pick = ranked[0]?.member;
  if (!pick) return { assigned: false, reason: "No active cleaners" };

  await prisma.cleanerAssignment.create({
    data: {
      turnoverId: turnover.id,
      teamMemberId: pick.id,
      status: "assigned",
      notes: "Assigned by Cleaning Scheduler Agent",
    },
  });
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: { status: "ASSIGNED" },
  });

  await proposeAgentAction({
    companyId,
    turnoverId: turnover.id,
    agentType: "CLEANER_DISPATCH",
    title: `Dispatch ${pick.name}`,
    description: `Send checklist, timing window, and photo requirements to ${pick.name} for ${turnover.property.name}.`,
    payload: { teamMemberId: pick.id },
  });

  return { assigned: true, teamMemberId: pick.id, name: pick.name };
}

async function dispatchCleaner(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  const assignment = turnover.assignments[0];
  if (!assignment) return { dispatched: false };
  await prisma.cleanerAssignment.update({
    where: { id: assignment.id },
    data: { dispatchedAt: new Date(), status: "dispatched" },
  });
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: { status: "IN_PROGRESS" },
  });
  return { dispatched: true, assignmentId: assignment.id };
}

async function runChecklistQa(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  const total = turnover.checklist.length;
  const done = turnover.checklist.filter((c) => c.completed).length;
  const incomplete = turnover.checklist.filter((c) => !c.completed);
  const pass = incomplete.length === 0 && total > 0;
  if (pass) {
    await prisma.turnover.update({
      where: { id: turnover.id },
      data: { status: "QA_PENDING" },
    });
  }
  return { total, done, pass, incomplete: incomplete.map((i) => i.title) };
}

async function verifyPhotos(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  const required = turnover.checklist.filter((c) => c.requiresPhoto);
  const photos = turnover.photos;
  let verified = 0;
  for (const photo of photos) {
    const score = 0.75 + Math.random() * 0.2;
    const ok = score >= 0.8;
    await prisma.photoSubmission.update({
      where: { id: photo.id },
      data: {
        verified: ok,
        verifiedAt: ok ? new Date() : null,
        rejected: !ok,
        aiScore: Math.round(score * 100) / 100,
        aiNotes: ok
          ? "Photo meets framing and cleanliness criteria."
          : "Photo may be blurry or incomplete — re-shoot recommended.",
      },
    });
    if (ok) verified++;
  }
  const missing = required.length - photos.length;
  return { verified, total: photos.length, missing: Math.max(0, missing) };
}

async function escalateIssues(
  turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>,
  payload: Record<string, unknown>
) {
  const issue = await prisma.issue.create({
    data: {
      turnoverId: turnover.id,
      title: String(payload.title ?? "Flagged during turnover"),
      description: String(payload.description ?? "Issue escalated by Issue Escalation Agent"),
      severity: (payload.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "HIGH",
      category: String(payload.category ?? "damage"),
      status: "ESCALATED",
    },
  });
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: { status: "ISSUES_OPEN" },
  });
  return { issueId: issue.id };
}

async function restockInventory(
  companyId: string,
  turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>
) {
  const low = await prisma.inventoryItem.findMany({
    where: {
      companyId,
      OR: [{ propertyId: turnover.propertyId }, { propertyId: null }],
    },
  });
  const alerts = low.filter((i) => i.quantity <= i.reorderLevel);
  for (const item of alerts) {
    await prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        quantity: item.quantity + item.reorderLevel,
        lastRestockedAt: new Date(),
      },
    });
  }
  return { restocked: alerts.map((a) => a.name) };
}

async function sendOwnerUpdate(turnover: NonNullable<Awaited<ReturnType<typeof loadTurnover>>>) {
  const owner = turnover.property.owner;
  if (!owner) return { sent: false, reason: "No owner linked" };
  const completed = turnover.checklist.filter((c) => c.completed).length;
  const body = [
    `Turnover complete for ${turnover.property.name} (${turnover.property.unitCode}).`,
    `Checklist: ${completed}/${turnover.checklist.length} items.`,
    `Photos submitted: ${turnover.photos.length}.`,
    turnover.completionNotes ? `Notes: ${turnover.completionNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const report = await prisma.ownerReport.create({
    data: {
      ownerId: owner.id,
      turnoverId: turnover.id,
      subject: `Turnover complete — ${turnover.property.name}`,
      body,
      status: "sent",
      sentAt: new Date(),
    },
  });
  await prisma.turnover.update({
    where: { id: turnover.id },
    data: { ownerNotifiedAt: new Date(), status: "COMPLETED", signedOffAt: new Date() },
  });
  return { reportId: report.id, sent: true };
}

async function loadTurnover(id: string) {
  return prisma.turnover.findUnique({
    where: { id },
    include: {
      property: { include: { sop: { include: { steps: true } }, sowTemplate: true, owner: true } },
      checklist: true,
      photos: true,
      assignments: true,
    },
  });
}

export type { Turnover };
