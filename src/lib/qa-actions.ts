"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  decideQaInspection,
  ensureQaInspection,
  setQaOverride,
  updateQaItemResult,
  updateQaPhotoResult,
  type QaItemResult,
} from "@/lib/qa";

function revalidateQaPaths(turnoverId?: string, inspectionId?: string) {
  revalidatePath("/qa");
  revalidatePath("/turnovers");
  revalidatePath("/dashboard");
  if (turnoverId) {
    revalidatePath(`/qa/${turnoverId}`);
    revalidatePath(`/turnovers/${turnoverId}`);
  }
  if (inspectionId) revalidatePath(`/qa/${turnoverId}`);
}

export async function openQaInspectionAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) return { error: "No company" };

  const turnoverId = String(formData.get("turnoverId") || "");
  if (!turnoverId) return { error: "Turnover required" };

  try {
    await ensureQaInspection({
      companyId: user.companyId,
      turnoverId,
      userId: user.id,
      actorName: user.name,
      claim: true,
    });
    revalidateQaPaths(turnoverId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not open QA" };
  }
}

export async function reviewQaItemAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) return { error: "No company" };

  const itemId = String(formData.get("itemId") || "");
  const result = String(formData.get("result") || "") as QaItemResult;
  const comment = String(formData.get("comment") || "").trim();
  const turnoverId = String(formData.get("turnoverId") || "");

  if (!itemId || !result) return { error: "Item and result required" };

  try {
    await updateQaItemResult({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      itemId,
      result,
      comment: comment || undefined,
    });
    revalidateQaPaths(turnoverId || undefined);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Review failed" };
  }
}

export async function reviewQaPhotoAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) return { error: "No company" };

  const photoId = String(formData.get("photoId") || "");
  const result = String(formData.get("result") || "") as QaItemResult;
  const comment = String(formData.get("comment") || "").trim();
  const turnoverId = String(formData.get("turnoverId") || "");

  if (!photoId || !result) return { error: "Photo and result required" };

  try {
    await updateQaPhotoResult({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      photoId,
      result,
      comment: comment || undefined,
    });
    revalidateQaPaths(turnoverId || undefined);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Photo review failed" };
  }
}

export async function decideQaAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) return { error: "No company" };

  const inspectionId = String(formData.get("inspectionId") || "");
  const turnoverId = String(formData.get("turnoverId") || "");
  const decision = String(formData.get("decision") || "") as
    | "APPROVED"
    | "REJECTED"
    | "NEEDS_REWORK";
  const decisionNote = String(formData.get("decisionNote") || "").trim();
  const overrideIncomplete = String(formData.get("overrideIncomplete") || "") === "1";

  if (!inspectionId || !decision) return { error: "Decision required" };
  if (!["APPROVED", "REJECTED", "NEEDS_REWORK"].includes(decision)) {
    return { error: "Invalid decision" };
  }

  try {
    await decideQaInspection({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      inspectionId,
      decision,
      decisionNote: decisionNote || undefined,
      overrideIncomplete,
    });
    revalidateQaPaths(turnoverId || undefined, inspectionId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Decision failed" };
  }
}

export async function setQaOverrideAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) return { error: "No company" };

  const inspectionId = String(formData.get("inspectionId") || "");
  const turnoverId = String(formData.get("turnoverId") || "");
  const overrideIncomplete = String(formData.get("overrideIncomplete") || "") === "1";
  if (!inspectionId) return { error: "Inspection required" };

  try {
    await setQaOverride({
      companyId: user.companyId,
      userId: user.id,
      inspectionId,
      overrideIncomplete,
    });
    revalidateQaPaths(turnoverId || undefined, inspectionId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Override failed" };
  }
}
