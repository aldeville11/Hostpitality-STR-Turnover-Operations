"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  assignCleanerToTurnover,
  evaluateAssignmentConflicts,
  updateCleanerAvailability,
  updateCleanerProfile,
  type AvailabilityStatus,
} from "@/lib/cleaners";
import { assertTurnoverInScope } from "@/lib/access-scope";

function revalidateCleanerPaths(cleanerId?: string, turnoverId?: string) {
  revalidatePath("/cleaners");
  revalidatePath("/assignments");
  revalidatePath("/turnovers");
  revalidatePath("/dashboard");
  if (cleanerId) revalidatePath(`/cleaners/${cleanerId}`);
  if (turnoverId) revalidatePath(`/turnovers/${turnoverId}`);
}

export async function assignFromCleanersAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) return { error: "No company" };

  const turnoverId = String(formData.get("turnoverId") || formData.get("id") || "");
  const vendorId = String(formData.get("vendorId") || "") || null;
  const note = String(formData.get("note") || "").trim() || undefined;
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const manualOverride = String(formData.get("manualOverride") || "") === "1";

  if (!turnoverId) return { error: "Turnover required" };

  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, turnoverId);
    const result = await assignCleanerToTurnover({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      turnoverId,
      vendorId,
      note,
      reason,
      manualOverride,
    });

    if (!result.ok) {
      return {
        error: result.error,
        conflicts: result.conflicts,
        requiresOverride: result.requiresOverride,
      };
    }

    revalidateCleanerPaths(vendorId ?? undefined, turnoverId);
    return { ok: true as const, conflicts: result.conflicts };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Assignment failed" };
  }
}

export async function previewAssignmentConflictsAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) return { error: "No company", conflicts: [] };

  const turnoverId = String(formData.get("turnoverId") || "");
  const vendorId = String(formData.get("vendorId") || "");
  if (!turnoverId || !vendorId) return { conflicts: [] };

  try {
    await assertTurnoverInScope(user.companyId, user.accessScope, turnoverId);
  } catch {
    return { conflicts: [] };
  }

  const { conflicts } = await evaluateAssignmentConflicts({
    companyId: user.companyId,
    vendorId,
    turnoverId,
  });
  return { conflicts };
}

export async function updateAvailabilityAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) return { error: "No company" };

  const vendorId = String(formData.get("vendorId") || "");
  const availabilityStatus = String(
    formData.get("availabilityStatus") || "AVAILABLE"
  ) as AvailabilityStatus;
  const unavailableUntilRaw = String(formData.get("unavailableUntil") || "").trim();
  const unavailableReason = String(formData.get("unavailableReason") || "").trim();

  if (!vendorId) return { error: "Cleaner required" };
  if (!["AVAILABLE", "UNAVAILABLE", "OUT_OF_SERVICE"].includes(availabilityStatus)) {
    return { error: "Invalid availability status" };
  }

  try {
    await updateCleanerAvailability({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      vendorId,
      availabilityStatus,
      unavailableUntil: unavailableUntilRaw ? new Date(unavailableUntilRaw) : null,
      unavailableReason: unavailableReason || null,
    });
    revalidateCleanerPaths(vendorId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateCleanerProfileAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) return { error: "No company" };

  const vendorId = String(formData.get("vendorId") || "");
  if (!vendorId) return { error: "Cleaner required" };

  const coverageAreas = String(formData.get("coverageAreas") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const skills = String(formData.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const capacity = Number(formData.get("capacity") || 3);
  const rating = Number(formData.get("rating") || 5);
  const phone = String(formData.get("phone") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  try {
    await updateCleanerProfile({
      companyId: user.companyId,
      userId: user.id,
      vendorId,
      coverageAreas,
      skills,
      capacity,
      rating,
      phone,
      notes,
    });
    revalidateCleanerPaths(vendorId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}
