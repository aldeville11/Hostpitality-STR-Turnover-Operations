"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  activateWorkspace,
  markStep,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { slugify } from "@/lib/utils";

async function requireOnboardingUser() {
  const user = await requireUser({ permission: "onboarding:run" });
  if (!user.companyId) redirect("/signup");
  if (user.company?.onboardedAt) redirect("/dashboard");
  return user as typeof user & { companyId: string };
}

function revalidateOnboarding() {
  revalidatePath("/onboarding");
  revalidatePath("/onboarding/company");
  revalidatePath("/onboarding/properties");
  revalidatePath("/onboarding/calendars");
  revalidatePath("/onboarding/sops");
  revalidatePath("/onboarding/sows");
  revalidatePath("/onboarding/vendors");
  revalidatePath("/onboarding/review");
  revalidatePath("/onboarding/finish");
}

export async function saveCompanyStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const name = String(formData.get("name") || "").trim();
  const timezone = String(formData.get("timezone") || "America/Los_Angeles").trim();

  if (name.length < 2) return;

  let slug = slugify(name);
  const taken = await prisma.company.findFirst({
    where: { slug, NOT: { id: user.companyId } },
  });
  if (taken) slug = `${slug}-${Date.now().toString(36)}`;

  await prisma.company.update({
    where: { id: user.companyId },
    data: { name, timezone, slug },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "company.updated",
    entityType: "Company",
    entityId: user.companyId,
  });

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "company",
    status: "complete",
    advance: true,
  });

  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/properties");
}

export async function addPropertyStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const name = String(formData.get("name") || "").trim();
  const unitCode = String(formData.get("unitCode") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim() || "Unknown";
  const state = String(formData.get("state") || "").trim() || "NA";
  const bedrooms = Number(formData.get("bedrooms") || 1);
  const bathrooms = Number(formData.get("bathrooms") || 1);

  if (!name || !unitCode || !address) {
    return { error: "Name, unit code, and address are required." };
  }

  const existing = await prisma.property.findUnique({
    where: { companyId_unitCode: { companyId: user.companyId, unitCode } },
  });
  if (existing) return { error: "That unit code already exists." };

  const property = await prisma.property.create({
    data: {
      companyId: user.companyId,
      name,
      unitCode,
      address,
      city,
      state,
      bedrooms,
      bathrooms,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.created",
    entityType: "Property",
    entityId: property.id,
  });

  await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "properties",
    status: "complete",
    advance: false,
  });

  revalidateOnboarding();
  return;
}

export async function continuePropertiesAction() {
  const user = await requireOnboardingUser();
  const count = await prisma.property.count({ where: { companyId: user.companyId } });
  if (count < 1) return { error: "Add at least one property before continuing." };

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "properties",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/calendars");
}

export async function saveCalendarStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const propertyId = String(formData.get("propertyId") || "");
  const calendarUrl = String(formData.get("calendarUrl") || "").trim() || null;
  const bookingSource = String(formData.get("bookingSource") || "manual").trim();

  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId: user.companyId },
  });
  if (!property) return { error: "Property not found." };

  await prisma.property.update({
    where: { id: propertyId },
    data: { calendarUrl, bookingSource },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.calendar.updated",
    entityType: "Property",
    entityId: propertyId,
    metadata: { bookingSource, hasCalendar: Boolean(calendarUrl) },
  });

  await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "calendars",
    status: "complete",
    advance: false,
  });

  revalidateOnboarding();
  return;
}

export async function continueCalendarsAction() {
  const user = await requireOnboardingUser();
  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "calendars",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/sops");
}

export async function skipStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const stepId = String(formData.get("stepId") || "") as OnboardingStepId;
  if (stepId !== "calendars") return;

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId,
    status: "skipped",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/sops");
}

export async function addSopStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!name) return { error: "SOP name is required." };

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const contentJson = JSON.stringify(
    lines.length
      ? lines.map((title, i) => ({
          section: i === 0 ? "Pre-turnover prep" : "Room-by-room",
          title,
        }))
      : [
          { section: "Pre-turnover prep", title: "Gather supplies & confirm checkout" },
          { section: "Room-by-room", title: "Clean all rooms" },
          { section: "Photo documentation", title: "Capture proof photos" },
          { section: "Completion sign-off", title: "Sign off turnover" },
        ]
  );

  const sop = await prisma.sop.create({
    data: {
      companyId: user.companyId,
      name,
      description: description || null,
      contentJson,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "sop.created",
    entityType: "Sop",
    entityId: sop.id,
  });

  await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "sops",
    status: "complete",
    advance: false,
  });

  revalidateOnboarding();
  return;
}

export async function continueSopsAction() {
  const user = await requireOnboardingUser();
  const count = await prisma.sop.count({ where: { companyId: user.companyId } });
  if (count < 1) return { error: "Upload at least one SOP before continuing." };

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "sops",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/sows");
}

export async function addSowStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const name = String(formData.get("name") || "").trim();
  const standardScope = String(formData.get("standardScope") || "").trim();
  const slaMinutes = Number(formData.get("slaMinutes") || 240);
  const addOns = String(formData.get("addOns") || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!name || !standardScope) return { error: "Name and standard scope are required." };

  const sow = await prisma.sow.create({
    data: {
      companyId: user.companyId,
      name,
      standardScope,
      slaMinutes,
      addOnsJson: JSON.stringify(addOns),
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "sow.created",
    entityType: "Sow",
    entityId: sow.id,
  });

  await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "sows",
    status: "complete",
    advance: false,
  });

  revalidateOnboarding();
  return;
}

export async function continueSowsAction() {
  const user = await requireOnboardingUser();
  const count = await prisma.sow.count({ where: { companyId: user.companyId } });
  if (count < 1) return { error: "Create at least one SOW template before continuing." };

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "sows",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/vendors");
}

export async function addVendorStepAction(formData: FormData) {
  const user = await requireOnboardingUser();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim() || null;
  const type = String(formData.get("type") || "CLEANER").trim();

  if (!name || !email) return { error: "Name and email are required." };

  try {
    const vendor = await prisma.vendor.create({
      data: {
        companyId: user.companyId,
        name,
        email,
        phone,
        type,
      },
    });

    await writeAuditLog({
      companyId: user.companyId,
      userId: user.id,
      action: "vendor.created",
      entityType: "Vendor",
      entityId: vendor.id,
    });
  } catch {
    return { error: "A vendor with that email already exists." };
  }

  await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "vendors",
    status: "complete",
    advance: false,
  });

  revalidateOnboarding();
  return;
}

export async function continueVendorsAction() {
  const user = await requireOnboardingUser();
  const count = await prisma.vendor.count({ where: { companyId: user.companyId } });
  if (count < 1) return { error: "Add at least one cleaner or vendor before continuing." };

  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "vendors",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/review");
}

export async function continueReviewAction() {
  const user = await requireOnboardingUser();
  const result = await markStep({
    companyId: user.companyId,
    userId: user.id,
    stepId: "review",
    status: "complete",
    advance: true,
  });
  revalidateOnboarding();
  redirect(result.nextHref ?? "/onboarding/finish");
}

export async function activateWorkspaceAction() {
  const user = await requireOnboardingUser();
  const result = await activateWorkspace({
    companyId: user.companyId,
    userId: user.id,
    createSampleTurnover: true,
  });
  if ("error" in result && result.error) return { error: result.error };

  revalidateOnboarding();
  redirect("/dashboard");
}
