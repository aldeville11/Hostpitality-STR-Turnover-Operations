"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  archiveSop,
  createBlankSop,
  createSopFromTemplate,
  duplicateSop,
  linkPropertiesToSop,
  parseSopDocument,
  publishSop,
  restoreSopDraft,
  restoreSopVersion,
  saveSopContent,
  type SopDocument,
  type SopSection,
  type SopStep,
} from "@/lib/sops";

function revalidateSopPaths(id?: string) {
  revalidatePath("/sops");
  revalidatePath("/properties");
  revalidatePath("/turnovers");
  revalidatePath("/onboarding/sops");
  if (id) revalidatePath(`/sops/${id}`);
}

function parseDocumentFromForm(formData: FormData): SopDocument | { error: string } {
  const raw = String(formData.get("documentJson") || "");
  if (!raw) return { error: "Missing SOP content" };
  try {
    const doc = parseSopDocument(raw);
    // Ensure ids exist after client round-trip
    doc.sections = doc.sections.map((section: SopSection) => ({
      ...section,
      steps: section.steps.map((step: SopStep) => ({ ...step })),
    }));
    return doc;
  } catch {
    return { error: "Invalid SOP content" };
  }
}

export async function createSopFromTemplateAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const templateKey = String(formData.get("templateKey") || "");
  const name = String(formData.get("name") || "").trim() || undefined;
  if (!templateKey) return { error: "Choose a template" };

  const sop = await createSopFromTemplate({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    templateKey,
    name,
  });

  revalidateSopPaths(sop.id);
  redirect(`/sops/${sop.id}`);
}

export async function createBlankSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const unitType = String(formData.get("unitType") || "").trim();
  if (!name) return { error: "Name is required" };

  const sop = await createBlankSop({
    companyId: user.companyId,
    userId: user.id,
    actorName: user.name,
    name,
    description,
    unitType: unitType || undefined,
  });

  revalidateSopPaths(sop.id);
  redirect(`/sops/${sop.id}`);
}

export async function duplicateSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  if (!sopId) return { error: "SOP required" };

  try {
    const sop = await duplicateSop({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sopId,
    });
    revalidateSopPaths(sop.id);
    redirect(`/sops/${sop.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Duplicate failed" };
  }
}

export async function saveSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const unitType = String(formData.get("unitType") || "").trim();
  const safetyNotes = String(formData.get("safetyNotes") || "");
  const changeNote = String(formData.get("changeNote") || "").trim();
  const bumpVersion = String(formData.get("bumpVersion") || "") === "1";

  if (!sopId) return { error: "SOP required" };
  if (!name) return { error: "Name is required" };

  const doc = parseDocumentFromForm(formData);
  if ("error" in doc) return doc;

  try {
    await saveSopContent({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sopId,
      name,
      description,
      unitType: unitType || undefined,
      safetyNotes,
      document: doc,
      bumpVersion,
      changeNote: changeNote || undefined,
    });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Save failed" };
  }
}

export async function publishSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  const changeNote = String(formData.get("changeNote") || "").trim();
  if (!sopId) return { error: "SOP required" };

  // Save latest editor content before publishing if provided
  const raw = String(formData.get("documentJson") || "");
  if (raw) {
    const name = String(formData.get("name") || "").trim();
    if (name) {
      const doc = parseDocumentFromForm(formData);
      if ("error" in doc) return doc;
      await saveSopContent({
        companyId: user.companyId,
        userId: user.id,
        actorName: user.name,
        sopId,
        name,
        description: String(formData.get("description") || "").trim(),
        unitType: String(formData.get("unitType") || "").trim() || undefined,
        safetyNotes: String(formData.get("safetyNotes") || ""),
        document: doc,
        bumpVersion: false,
        changeNote: "Saved before publish",
      });
    }
  }

  try {
    await publishSop({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sopId,
      changeNote: changeNote || undefined,
    });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Publish failed" };
  }
}

export async function archiveSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  if (!sopId) return { error: "SOP required" };

  try {
    await archiveSop({ companyId: user.companyId, userId: user.id, sopId });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Archive failed" };
  }
}

export async function restoreSopDraftAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  if (!sopId) return { error: "SOP required" };

  try {
    await restoreSopDraft({ companyId: user.companyId, userId: user.id, sopId });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Restore failed" };
  }
}

export async function linkSopPropertiesAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  if (!sopId) return { error: "SOP required" };

  const propertyIds = formData
    .getAll("propertyIds")
    .map((v) => String(v))
    .filter(Boolean);

  try {
    await linkPropertiesToSop({
      companyId: user.companyId,
      sopId,
      propertyIds,
      userId: user.id,
    });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Link failed" };
  }
}

export async function restoreSopVersionAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) return { error: "No company" };

  const sopId = String(formData.get("sopId") || "");
  const versionId = String(formData.get("versionId") || "");
  if (!sopId || !versionId) return { error: "Version required" };

  try {
    await restoreSopVersion({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      sopId,
      versionId,
    });
    revalidateSopPaths(sopId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Restore failed" };
  }
}
