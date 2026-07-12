"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createCompanyUser,
  parseSystemSettings,
  updateBranding,
  updateCompanyProfile,
  updateCompanyUser,
  updateNotificationAndHours,
  updatePropertyAdminDefaults,
  updateSystemSettings,
  type NotificationPrefs,
  type SystemSettings,
  type WorkingHours,
} from "@/lib/settings";

function revalidateSettings(section?: string) {
  revalidatePath("/settings");
  if (section) revalidatePath(`/settings/${section}`);
  revalidatePath("/dashboard");
  revalidatePath("/properties");
}

export async function updateCompanyProfileAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  try {
    await updateCompanyProfile({
      companyId: user.companyId,
      userId: user.id,
      name: String(formData.get("name") || ""),
      timezone: String(formData.get("timezone") || ""),
      contactName: String(formData.get("contactName") || "") || null,
      supportEmail: String(formData.get("supportEmail") || "") || null,
      supportPhone: String(formData.get("supportPhone") || "") || null,
    });
    revalidateSettings("company");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateNotificationsAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  const prefs: NotificationPrefs = {
    emailAssignments: formData.get("emailAssignments") === "1",
    emailQaOutcomes: formData.get("emailQaOutcomes") === "1",
    emailIssueUpdates: formData.get("emailIssueUpdates") === "1",
    smsUrgentOnly: formData.get("smsUrgentOnly") === "1",
    digestDaily: formData.get("digestDaily") === "1",
  };

  const hours: WorkingHours = {
    timezone: String(formData.get("timezone") || "America/Los_Angeles"),
    days: String(formData.get("days") || "mon,tue,wed,thu,fri,sat")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
    start: String(formData.get("start") || "08:00"),
    end: String(formData.get("end") || "18:00"),
  };

  try {
    await updateNotificationAndHours({
      companyId: user.companyId,
      userId: user.id,
      notificationPrefs: prefs,
      workingHours: hours,
    });
    revalidateSettings("company");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateBrandingAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  try {
    await updateBranding({
      companyId: user.companyId,
      userId: user.id,
      brandName: String(formData.get("brandName") || "") || null,
      logoUrl: String(formData.get("logoUrl") || "") || null,
      accentColor: String(formData.get("accentColor") || "") || null,
    });
    revalidateSettings("branding");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updatePropertyDefaultsAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  const propertyId = String(formData.get("propertyId") || "");
  if (!propertyId) return { error: "Property required" };

  try {
    await updatePropertyAdminDefaults({
      companyId: user.companyId,
      userId: user.id,
      propertyId,
      accessNotes: String(formData.get("accessNotes") || "") || null,
      turnoverBufferMins: Number(formData.get("turnoverBufferMins") || 60),
      sameDayTurnover: formData.get("sameDayTurnover") === "1",
      slaMinutes: formData.get("slaMinutes")
        ? Number(formData.get("slaMinutes"))
        : null,
      active: formData.get("active") === "1",
    });
    revalidateSettings("properties");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function createUserAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  try {
    await createCompanyUser({
      companyId: user.companyId,
      actorUserId: user.id,
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      role: String(formData.get("role") || ""),
      password: String(formData.get("password") || ""),
      allProperties: formData.get("allProperties") === "1",
      propertyIds: String(formData.get("propertyIds") || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    });
    revalidateSettings("users");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Create failed" };
  }
}

export async function updateUserAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  const userId = String(formData.get("userId") || "");
  if (!userId) return { error: "User required" };

  try {
    await updateCompanyUser({
      companyId: user.companyId,
      actorUserId: user.id,
      userId,
      name: String(formData.get("name") || ""),
      role: String(formData.get("role") || ""),
      active: formData.get("active") === "1",
      allProperties: formData.get("allProperties") === "1",
      propertyIds: String(formData.get("propertyIds") || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    });
    revalidateSettings("users");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateSystemSettingsAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) return { error: "No company" };

  const current = parseSystemSettings(String(formData.get("currentJson") || "{}"));
  const categories = String(formData.get("issueCategories") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const severities = String(formData.get("issueSeverities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const settings: SystemSettings = {
    ...current,
    issueCategories: categories.length ? categories : current.issueCategories,
    issueSeverities: severities.length ? severities : current.issueSeverities,
    defaultTurnoverBufferMins: Number(
      formData.get("defaultTurnoverBufferMins") || current.defaultTurnoverBufferMins
    ),
    defaultSlaMinutes: Number(formData.get("defaultSlaMinutes") || current.defaultSlaMinutes),
    defaultSopId: String(formData.get("defaultSopId") || "") || null,
    defaultSowId: String(formData.get("defaultSowId") || "") || null,
    slaHoursBySeverity: {
      CRITICAL: Number(formData.get("slaCritical") || current.slaHoursBySeverity.CRITICAL),
      HIGH: Number(formData.get("slaHigh") || current.slaHoursBySeverity.HIGH),
      MEDIUM: Number(formData.get("slaMedium") || current.slaHoursBySeverity.MEDIUM),
      LOW: Number(formData.get("slaLow") || current.slaHoursBySeverity.LOW),
    },
    featureFlags: {
      calendarSync: formData.get("flag_calendarSync") === "1",
      messagingHooks: formData.get("flag_messagingHooks") === "1",
      reportingExports: formData.get("flag_reportingExports") === "1",
      integrations: formData.get("flag_integrations") === "1",
      ownerSummaries: formData.get("flag_ownerSummaries") === "1",
    },
  };

  try {
    await updateSystemSettings({
      companyId: user.companyId,
      userId: user.id,
      systemSettings: settings,
    });
    revalidateSettings("system");
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}
