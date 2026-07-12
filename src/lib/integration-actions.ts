"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  attachStoredFile,
  connectIntegration,
  runIntegrationSync,
  setIntegrationEnabled,
} from "@/lib/integrations";

function revalidateIntegrationPaths(id?: string) {
  revalidatePath("/integrations");
  revalidatePath("/turnovers");
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/integrations/${id}`);
}

export async function connectIntegrationAction(formData: FormData) {
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) return { error: "No company" };

  const integrationId = String(formData.get("integrationId") || "");
  const externalAccount = String(formData.get("externalAccount") || "").trim();
  if (!integrationId) return { error: "Integration required" };

  try {
    await connectIntegration({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      integrationId,
      externalAccount: externalAccount || undefined,
    });
    revalidateIntegrationPaths(integrationId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Connect failed" };
  }
}

export async function setIntegrationEnabledAction(formData: FormData) {
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) return { error: "No company" };

  const integrationId = String(formData.get("integrationId") || "");
  const enabled = String(formData.get("enabled") || "") === "1";
  if (!integrationId) return { error: "Integration required" };

  try {
    await setIntegrationEnabled({
      companyId: user.companyId,
      userId: user.id,
      integrationId,
      enabled,
    });
    revalidateIntegrationPaths(integrationId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function syncIntegrationAction(formData: FormData) {
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) return { error: "No company" };

  const integrationId = String(formData.get("integrationId") || "");
  if (!integrationId) return { error: "Integration required" };

  try {
    const result = await runIntegrationSync({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      integrationId,
    });
    revalidateIntegrationPaths(integrationId);
    return { ok: true as const, stats: result.stats };
  } catch (err) {
    revalidateIntegrationPaths(integrationId);
    return { error: err instanceof Error ? err.message : "Sync failed" };
  }
}

export async function attachFileAction(formData: FormData) {
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) return { error: "No company" };

  const entityType = String(formData.get("entityType") || "").trim();
  const entityId = String(formData.get("entityId") || "").trim();
  const filename = String(formData.get("filename") || "").trim();
  const label = String(formData.get("label") || "").trim();
  if (!entityType || !entityId || !filename) {
    return { error: "Entity and filename required" };
  }

  try {
    const file = await attachStoredFile({
      companyId: user.companyId,
      userId: user.id,
      entityType,
      entityId,
      filename,
      label: label || undefined,
      source: String(formData.get("source") || "UPLOAD"),
    });
    revalidateIntegrationPaths();
    return { ok: true as const, fileId: file.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Attach failed" };
  }
}
