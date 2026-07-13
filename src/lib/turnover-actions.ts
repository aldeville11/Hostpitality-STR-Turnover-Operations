"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { can } from "@/lib/rbac";
import {
  canTransition,
  createTurnoverFromBooking,
  generateChecklistForTurnover,
  recordStatusChange,
  syncTurnoversFromCalendars,
} from "@/lib/turnovers";
import { assertPropertyInScope, assertTurnoverInScope } from "@/lib/access-scope";

function revalidateTurnoverPaths(id?: string) {
  revalidatePath("/turnovers");
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  if (id) revalidatePath(`/turnovers/${id}`);
}

export async function syncTurnoversAction() {
  const user = await requireUser({ permission: "turnovers:manage" });
  if (!user.companyId) return { error: "No company" };

  const results = await syncTurnoversFromCalendars({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    accessScope: user.accessScope,
  });

  revalidateTurnoverPaths();
  return { ok: true as const, count: results.filter((r) => r.created).length };
}

export async function createTurnoverForPropertyAction(formData: FormData) {
  const user = await requireUser({ permission: "turnovers:manage" });
  if (!user.companyId) return { error: "No company" };

  const propertyId = String(formData.get("propertyId") || "");
  const priority = String(formData.get("priority") || "NORMAL");
  if (!propertyId) return { error: "Property required" };

  try {
    await assertPropertyInScope(user.accessScope, propertyId);
  } catch {
    return { error: "Not found" };
  }

  const result = await createTurnoverFromBooking({
    companyId: user.companyId,
    userId: user.id,
    propertyId,
    priority,
    actorName: user.name,
    notes: "Manually created from property booking window",
  });

  revalidateTurnoverPaths(result.turnoverId);
  redirect(`/turnovers/${result.turnoverId}`);
}

export async function updateTurnoverStatusAction(formData: FormData) {
  const user = await requireUser({ permission: "turnovers:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || "");
  const toStatus = String(formData.get("toStatus") || "");
  const note = String(formData.get("note") || "").trim() || undefined;

  const turnover = await prisma.turnover.findFirst({
    where: { id, companyId: user.companyId },
    include: { checklistItems: true },
  });
  if (!turnover) return { error: "Turnover not found" };
  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, turnover.id);
  } catch {
    return { error: "Not found" };
  }
  if (!canTransition(turnover.status, toStatus)) {
    return { error: `Cannot move from ${turnover.status} to ${toStatus}` };
  }

  if (toStatus === "READY_FOR_QA") {
    const incomplete = turnover.checklistItems.filter((i) => !i.completed);
    if (turnover.checklistItems.length > 0 && incomplete.length > 0) {
      return { error: `Complete checklist first (${incomplete.length} remaining).` };
    }
  }

  if (toStatus === "ASSIGNED" && !turnover.vendorId) {
    return { error: "Assign a cleaner before marking Assigned." };
  }

  await prisma.turnover.update({
    where: { id },
    data: { status: toStatus },
  });

  await recordStatusChange({
    turnoverId: id,
    fromStatus: turnover.status,
    toStatus,
    note,
    actorId: user.id,
    actorName: user.name,
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "turnover.status_changed",
    entityType: "Turnover",
    entityId: id,
    metadata: { from: turnover.status, to: toStatus, note },
  });

  revalidateTurnoverPaths(id);
  return;
}

export async function assignCleanerAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || formData.get("turnoverId") || "");
  const vendorId = String(formData.get("vendorId") || "") || null;
  const note = String(formData.get("note") || "").trim() || undefined;
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const manualOverride = String(formData.get("manualOverride") || "") === "1";

  if (!id) return { error: "Turnover required" };

  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, id);
  } catch {
    return { error: "Not found" };
  }

  const { assignCleanerToTurnover } = await import("@/lib/cleaners");

  // Turnover detail stays fast: override warnings by default, but still record them.
  const result = await assignCleanerToTurnover({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    turnoverId: id,
    vendorId,
    note,
    reason,
    manualOverride: manualOverride || true,
  });

  if (!result.ok) {
    return { error: result.error, conflicts: result.conflicts };
  }

  const { notifyViaIntegrations } = await import("@/lib/integrations");
  await notifyViaIntegrations({
    companyId: user.companyId,
    title: "Cleaner assignment updated",
    body: vendorId
      ? `A cleaner was assigned to turnover ${id}`
      : `Cleaner unassigned from turnover ${id}`,
    type: "assignment.update",
    userId: user.id,
    channels: ["EMAIL", "SMS"],
  }).catch(() => null);

  revalidateTurnoverPaths(id);
  revalidatePath("/cleaners");
  revalidatePath("/assignments");
  return { ok: true as const, conflicts: result.conflicts };
}

export async function toggleChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  if (!user.companyId) return { error: "No company" };
  if (!can(user.role, "turnovers:manage") && !can(user.role, "turnovers:execute")) {
    return { error: "Not allowed to update checklist" };
  }

  const itemId = String(formData.get("itemId") || "");
  const item = await prisma.turnoverChecklistItem.findUnique({
    where: { id: itemId },
    include: { turnover: true },
  });
  if (!item || item.turnover.companyId !== user.companyId) {
    return { error: "Checklist item not found" };
  }

  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, item.turnoverId);
  } catch {
    return { error: "Not found" };
  }

  const completed = !item.completed;
  await prisma.turnoverChecklistItem.update({
    where: { id: itemId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      completedBy: completed ? user.name : null,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: completed ? "turnover.checklist.completed" : "turnover.checklist.reopened",
    entityType: "TurnoverChecklistItem",
    entityId: itemId,
    metadata: { turnoverId: item.turnoverId, title: item.title },
  });

  revalidateTurnoverPaths(item.turnoverId);
  return;
}

export async function regenerateChecklistAction(formData: FormData) {
  const user = await requireUser({ permission: "turnovers:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || "");
  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, id);
  } catch {
    return { error: "Not found" };
  }

  const turnover = await prisma.turnover.findFirst({
    where: { id, companyId: user.companyId },
    include: { sop: true },
  });
  if (!turnover) return { error: "Turnover not found" };

  const count = await generateChecklistForTurnover(id, turnover.sop?.contentJson);
  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "turnover.checklist.regenerated",
    entityType: "Turnover",
    entityId: id,
    metadata: { count },
  });

  revalidateTurnoverPaths(id);
  return;
}
