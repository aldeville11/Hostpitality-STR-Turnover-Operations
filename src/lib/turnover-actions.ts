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
  recordAssignmentChange,
  recordStatusChange,
  syncTurnoversFromCalendars,
} from "@/lib/turnovers";

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

  const id = String(formData.get("id") || "");
  const vendorId = String(formData.get("vendorId") || "") || null;
  const note = String(formData.get("note") || "").trim() || undefined;

  const turnover = await prisma.turnover.findFirst({
    where: { id, companyId: user.companyId },
    include: { vendor: true },
  });
  if (!turnover) return { error: "Turnover not found" };

  const nextVendor = vendorId
    ? await prisma.vendor.findFirst({ where: { id: vendorId, companyId: user.companyId } })
    : null;
  if (vendorId && !nextVendor) return { error: "Cleaner not found" };

  const nextStatus =
    vendorId && ["DRAFT", "SCHEDULED", "BLOCKED"].includes(turnover.status)
      ? "ASSIGNED"
      : !vendorId && turnover.status === "ASSIGNED"
        ? "SCHEDULED"
        : turnover.status;

  await prisma.turnover.update({
    where: { id },
    data: {
      vendorId,
      status: nextStatus,
    },
  });

  await recordAssignmentChange({
    turnoverId: id,
    fromVendorId: turnover.vendorId,
    toVendorId: vendorId,
    fromName: turnover.vendor?.name,
    toName: nextVendor?.name,
    note: note ?? (vendorId ? "Cleaner assigned" : "Cleaner unassigned"),
    actorId: user.id,
    actorName: user.name,
  });

  if (nextStatus !== turnover.status) {
    await recordStatusChange({
      turnoverId: id,
      fromStatus: turnover.status,
      toStatus: nextStatus,
      note: "Status updated with assignment change",
      actorId: user.id,
      actorName: user.name,
    });
  }

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "turnover.assigned",
    entityType: "Turnover",
    entityId: id,
    metadata: {
      fromVendorId: turnover.vendorId,
      toVendorId: vendorId,
      status: nextStatus,
    },
  });

  revalidateTurnoverPaths(id);
  return;
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
