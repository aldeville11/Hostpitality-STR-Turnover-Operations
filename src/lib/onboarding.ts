import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { scheduleTurnoverReminder, enqueueJob } from "./jobs";

export const ONBOARDING_STEPS = [
  {
    id: "company",
    label: "Company",
    href: "/onboarding/company",
    description: "Confirm company profile",
    required: true,
  },
  {
    id: "properties",
    label: "Properties",
    href: "/onboarding/properties",
    description: "Add units to clean",
    required: true,
  },
  {
    id: "calendars",
    label: "Calendars",
    href: "/onboarding/calendars",
    description: "Import booking sources",
    required: false,
  },
  {
    id: "sops",
    label: "SOPs",
    href: "/onboarding/sops",
    description: "Upload cleaning playbooks",
    required: true,
  },
  {
    id: "sows",
    label: "SOW templates",
    href: "/onboarding/sows",
    description: "Define scope templates",
    required: true,
  },
  {
    id: "vendors",
    label: "Vendors",
    href: "/onboarding/vendors",
    description: "Add cleaners and vendors",
    required: true,
  },
  {
    id: "review",
    label: "Review",
    href: "/onboarding/review",
    description: "Check readiness",
    required: true,
  },
  {
    id: "finish",
    label: "Activate",
    href: "/onboarding/finish",
    description: "Start first turnover",
    required: true,
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

export type StepStatus = "pending" | "complete" | "skipped";

export type OnboardingProgress = Partial<Record<OnboardingStepId, StepStatus>>;

export function parseProgress(raw: string | null | undefined): OnboardingProgress {
  try {
    return JSON.parse(raw || "{}") as OnboardingProgress;
  } catch {
    return {};
  }
}

export function getStepMeta(stepId: OnboardingStepId) {
  return ONBOARDING_STEPS.find((s) => s.id === stepId)!;
}

export function getNextStep(current: OnboardingStepId): OnboardingStepId | null {
  const idx = ONBOARDING_STEPS.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= ONBOARDING_STEPS.length - 1) return null;
  return ONBOARDING_STEPS[idx + 1].id;
}

export function getResumeHref(progress: OnboardingProgress, currentStep: string) {
  for (const step of ONBOARDING_STEPS) {
    const status = progress[step.id];
    if (status !== "complete" && status !== "skipped") {
      return step.href;
    }
  }
  const known = ONBOARDING_STEPS.find((s) => s.id === currentStep);
  return known?.href ?? "/onboarding/finish";
}

export async function getOnboardingContext(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      properties: { orderBy: { createdAt: "asc" } },
      sops: { orderBy: { createdAt: "asc" } },
      sows: { orderBy: { createdAt: "asc" } },
      vendors: { orderBy: { createdAt: "asc" } },
      turnovers: { take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  const progress = parseProgress(company.onboardingProgress);

  return {
    company,
    progress,
    counts: {
      properties: company.properties.length,
      calendars: company.properties.filter((p) => p.calendarUrl || p.bookingSource !== "manual").length,
      sops: company.sops.length,
      sows: company.sows.length,
      vendors: company.vendors.length,
      turnovers: company.turnovers.length,
    },
  };
}

export function validateActivation(input: {
  properties: number;
  sops: number;
  sows: number;
  vendors: number;
  progress: OnboardingProgress;
}) {
  const errors: string[] = [];
  if (input.progress.company !== "complete") errors.push("Confirm company details.");
  if (input.properties < 1) errors.push("Add at least one property.");
  if (input.sops < 1) errors.push("Upload at least one SOP.");
  if (input.sows < 1) errors.push("Create at least one SOW template.");
  if (input.vendors < 1) errors.push("Add at least one cleaner or vendor.");
  return errors;
}

export async function markStep(input: {
  companyId: string;
  userId: string;
  stepId: OnboardingStepId;
  status: StepStatus;
  advance?: boolean;
}) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: input.companyId } });
  const progress = parseProgress(company.onboardingProgress);
  progress[input.stepId] = input.status;

  const next = input.advance ? getNextStep(input.stepId) : null;
  const onboardingStep = next ?? input.stepId;

  await prisma.company.update({
    where: { id: input.companyId },
    data: {
      onboardingProgress: JSON.stringify(progress),
      onboardingStep,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: `onboarding.step.${input.status}`,
    entityType: "Company",
    entityId: input.companyId,
    metadata: { stepId: input.stepId, next: onboardingStep },
  });

  return { progress, onboardingStep, nextHref: next ? getStepMeta(next).href : null };
}

export async function activateWorkspace(input: {
  companyId: string;
  userId: string;
  createSampleTurnover?: boolean;
}) {
  const ctx = await getOnboardingContext(input.companyId);
  const errors = validateActivation({
    properties: ctx.counts.properties,
    sops: ctx.counts.sops,
    sows: ctx.counts.sows,
    vendors: ctx.counts.vendors,
    progress: { ...ctx.progress, company: ctx.progress.company ?? "complete" },
  });
  if (errors.length) return { error: errors.join(" ") };

  let turnoverId: string | null = null;

  if (input.createSampleTurnover !== false) {
    const property = ctx.company.properties[0];
    const sop = ctx.company.sops[0];
    const sow = ctx.company.sows[0];
    const vendor = ctx.company.vendors[0];

    const windowStart = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + (sow?.slaMinutes ?? 240) * 60 * 1000);

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        externalId: `onboard-${Date.now()}`,
        guestName: "First Guest",
        checkIn: new Date(windowStart.getTime() - 3 * 24 * 60 * 60 * 1000),
        checkOut: windowStart,
        source: property.bookingSource || "onboarding",
      },
    });

    const turnover = await prisma.turnover.create({
      data: {
        companyId: input.companyId,
        propertyId: property.id,
        bookingId: booking.id,
        sopId: sop.id,
        sowId: sow.id,
        vendorId: vendor.id,
        status: "SCHEDULED",
        priority: "NORMAL",
        windowStart,
        windowEnd,
        deadlineAt: windowEnd,
        photosRequired: 4,
        photosUploaded: 0,
        photosVerified: 0,
        notes: "Created during onboarding activation",
      },
    });

    turnoverId = turnover.id;

    await scheduleTurnoverReminder({
      companyId: input.companyId,
      turnoverId: turnover.id,
      windowStart,
    });

    await enqueueJob({
      companyId: input.companyId,
      type: "turnover.overdue_check",
      runAt: windowEnd,
      payload: { turnoverId: turnover.id },
    });

    await writeAuditLog({
      companyId: input.companyId,
      userId: input.userId,
      action: "turnover.created",
      entityType: "Turnover",
      entityId: turnover.id,
      metadata: { source: "onboarding" },
    });
  }

  const progress = { ...ctx.progress, review: "complete" as const, finish: "complete" as const };

  await prisma.company.update({
    where: { id: input.companyId },
    data: {
      onboardedAt: new Date(),
      onboardingStep: "finish",
      onboardingProgress: JSON.stringify(progress),
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "onboarding.completed",
    entityType: "Company",
    entityId: input.companyId,
    metadata: { turnoverId },
  });

  return { ok: true as const, turnoverId };
}
