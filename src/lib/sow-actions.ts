"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  activateSow,
  approveSow,
  archiveSow,
  createBlankSow,
  duplicateSow,
  linkPropertiesToSow,
  parseSowDocument,
  restoreSowDraft,
  restoreSowVersion,
  saveSowContent,
  submitSowForReview,
  type SowDocument,
} from "@/lib/sows";

function revalidateSowPaths(id?: string) {
  revalidatePath("/sows");
  revalidatePath("/sow-templates");
  revalidatePath("/properties");
  revalidatePath("/turnovers");
  revalidatePath("/onboarding/sows");
  if (id) revalidatePath(`/sows/${id}`);
}

function parseDocumentFromForm(formData: FormData): SowDocument | { error: string } {
  const raw = String(formData.get("documentJson") || "");
  if (!raw) return { error: "Missing SOW content" };
  try {
    return parseSowDocument(raw);
  } catch {
    return { error: "Invalid SOW content" };
  }
}

export async function createBlankSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const unitType = String(formData.get("unitType") || "").trim();
  const useCase = String(formData.get("useCase") || "").trim();
  const propertyGroup = String(formData.get("propertyGroup") || "").trim();
  if (!name) return { error: "Name is required" };

  const sow = await createBlankSow({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    name,
    description,
    unitType: unitType || undefined,
    useCase: useCase || undefined,
    propertyGroup: propertyGroup || undefined,
  });

  revalidateSowPaths(sow.id);
  redirect(`/sows/${sow.id}`);
}

export async function duplicateSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };

  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    const sow = await duplicateSow({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
    });
    revalidateSowPaths(sow.id);
    redirect(`/sows/${sow.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Duplicate failed" };
  }
}

export async function saveSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };

  const sowId = String(formData.get("sowId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!sowId) return { error: "SOW required" };
  if (!name) return { error: "Name is required" };

  const doc = parseDocumentFromForm(formData);
  if ("error" in doc) return doc;

  try {
    await saveSowContent({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
      name,
      description: String(formData.get("description") || "").trim(),
      unitType: String(formData.get("unitType") || "").trim() || undefined,
      useCase: String(formData.get("useCase") || "").trim() || undefined,
      propertyGroup: String(formData.get("propertyGroup") || "").trim() || undefined,
      slaMinutes: Number(formData.get("slaMinutes") || 240),
      completionDeadlineMinutes: Number(formData.get("completionDeadlineMinutes") || 240),
      document: doc,
      bumpVersion: String(formData.get("bumpVersion") || "") === "1",
      changeNote: String(formData.get("changeNote") || "").trim() || undefined,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
  }
}

async function saveIfPayloadPresent(
  user: { companyId: string; id: string; name: string },
  formData: FormData,
  sowId: string
) {
  const raw = String(formData.get("documentJson") || "");
  const name = String(formData.get("name") || "").trim();
  if (!raw || !name) return;
  const doc = parseDocumentFromForm(formData);
  if ("error" in doc) throw new Error(doc.error);
  await saveSowContent({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    sowId,
    name,
    description: String(formData.get("description") || "").trim(),
    unitType: String(formData.get("unitType") || "").trim() || undefined,
    useCase: String(formData.get("useCase") || "").trim() || undefined,
    propertyGroup: String(formData.get("propertyGroup") || "").trim() || undefined,
    slaMinutes: Number(formData.get("slaMinutes") || 240),
    completionDeadlineMinutes: Number(formData.get("completionDeadlineMinutes") || 240),
    document: doc,
    bumpVersion: false,
    changeNote: "Saved before status change",
  });
}

export async function submitSowReviewAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    await saveIfPayloadPresent(
      { companyId: user.companyId, id: user.id, name: user.name },
      formData,
      sowId
    );
    await submitSowForReview({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
      changeNote: String(formData.get("changeNote") || "").trim() || undefined,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Submit failed" };
  }
}

export async function approveSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    await approveSow({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
      changeNote: String(formData.get("changeNote") || "").trim() || undefined,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Approve failed" };
  }
}

export async function activateSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    await activateSow({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
      changeNote: String(formData.get("changeNote") || "").trim() || undefined,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Activate failed" };
  }
}

export async function archiveSowAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    await archiveSow({ companyId: user.companyId, userId: user.id, sowId });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Archive failed" };
  }
}

export async function restoreSowDraftAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  try {
    await restoreSowDraft({ companyId: user.companyId, userId: user.id, sowId });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Restore failed" };
  }
}

export async function linkSowPropertiesAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  if (!sowId) return { error: "SOW required" };

  const propertyIds = formData
    .getAll("propertyIds")
    .map((v) => String(v))
    .filter(Boolean);

  try {
    await linkPropertiesToSow({
      companyId: user.companyId,
      sowId,
      propertyIds,
      userId: user.id,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Link failed" };
  }
}

export async function restoreSowVersionAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) return { error: "No company" };
  const sowId = String(formData.get("sowId") || "");
  const versionId = String(formData.get("versionId") || "");
  if (!sowId || !versionId) return { error: "Version required" };

  try {
    await restoreSowVersion({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sowId,
      versionId,
    });
    revalidateSowPaths(sowId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Restore failed" };
  }
}
