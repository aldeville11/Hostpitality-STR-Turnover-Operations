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
import { assertTurnoverInScope, type AccessScope } from "@/lib/access-scope";
import { prisma } from "@/lib/db";
import { tenantNotFound } from "@/lib/tenant";

async function assertInspectionInScope(
  companyId: string,
  scope: AccessScope,
  inspectionId: string
) {
  const inspection = await prisma.qaInspection.findFirst({
    where: { id: inspectionId, companyId },
    select: { turnoverId: true },
  });
  if (!inspection) tenantNotFound();
  await assertTurnoverInScope(companyId, scope, inspection.turnoverId);
}

async function assertQaItemInScope(
  companyId: string,
  scope: AccessScope,
  itemId: string
) {
  const item = await prisma.qaInspectionItem.findUnique({
    where: { id: itemId },
    select: { inspection: { select: { companyId: true, turnoverId: true } } },
  });
  if (!item || item.inspection.companyId !== companyId) tenantNotFound();
  await assertTurnoverInScope(companyId, scope, item.inspection.turnoverId);
}

async function assertQaPhotoInScope(
  companyId: string,
  scope: AccessScope,
  photoId: string
) {
  const photo = await prisma.qaPhotoReview.findUnique({
    where: { id: photoId },
    select: { inspection: { select: { companyId: true, turnoverId: true } } },
  });
  if (!photo || photo.inspection.companyId !== companyId) tenantNotFound();
  await assertTurnoverInScope(companyId, scope, photo.inspection.turnoverId);
}

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
    await assertTurnoverInScope(user.companyId, user.accessScope, turnoverId);
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
    await assertQaItemInScope(user.companyId, user.accessScope, itemId);
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
    await assertQaPhotoInScope(user.companyId, user.accessScope, photoId);
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
    await assertInspectionInScope(user.companyId, user.accessScope, inspectionId);
    await decideQaInspection({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      inspectionId,
      decision,
      decisionNote: decisionNote || undefined,
      overrideIncomplete,
    });
    const { notifyViaIntegrations } = await import("@/lib/integrations");
    await notifyViaIntegrations({
      companyId: user.companyId,
      title: `QA ${decision.toLowerCase().replace("_", " ")}`,
      body: decisionNote || `Inspection marked ${decision}`,
      type: "qa.outcome",
      userId: user.id,
      channels: ["EMAIL", "SMS"],
    }).catch(() => null);
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
    await assertInspectionInScope(user.companyId, user.accessScope, inspectionId);
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
