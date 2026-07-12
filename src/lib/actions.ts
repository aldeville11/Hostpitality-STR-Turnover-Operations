"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword, createSession, destroySession, loginWithCredentials } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { executeApprovedAction, proposeAgentAction, runLeadTurnoverPipeline } from "@/lib/agents";
import { enqueueJob, processDueJobs } from "@/lib/jobs";
import { can } from "@/lib/rbac";
import type { Role } from "@/lib/types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = await loginWithCredentials(email, password);
  if ("error" in result && result.error) {
    return { error: result.error };
  }
  const user = result.user!;
  if (user.companyId) {
    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (company && !company.onboardedAt) redirect("/onboarding");
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function registerCompanyAction(formData: FormData) {
  const schema = z.object({
    companyName: z.string().min(2),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  });
  const parsed = schema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Please fill all fields correctly." };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return { error: "Email already registered." };

  let slug = slugify(parsed.data.companyName);
  const slugTaken = await prisma.company.findUnique({ where: { slug } });
  if (slugTaken) slug = `${slug}-${Date.now().toString(36)}`;

  const passwordHash = await hashPassword(parsed.data.password);
  const company = await prisma.company.create({
    data: {
      name: parsed.data.companyName,
      slug,
      users: {
        create: {
          email: parsed.data.email.toLowerCase(),
          name: parsed.data.name,
          passwordHash,
          role: "OPS_MANAGER",
        },
      },
    },
    include: { users: true },
  });

  await writeAuditLog({
    companyId: company.id,
    userId: company.users[0].id,
    action: "company.created",
    entityType: "Company",
    entityId: company.id,
  });

  await createSession(company.users[0].id);
  return { ok: true };
}

export async function completeOnboardingAction(formData: FormData) {
  const user = await requireUser({ permission: "onboarding:run" });
  if (!user.companyId) return { error: "No company" };

  const propertyName = String(formData.get("propertyName") || "").trim();
  const unitCode = String(formData.get("unitCode") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const calendarUrl = String(formData.get("calendarUrl") || "").trim();
  const sopName = String(formData.get("sopName") || "Standard Turnover SOP").trim();
  const sowName = String(formData.get("sowName") || "Standard SOW").trim();
  const cleanerName = String(formData.get("cleanerName") || "").trim();
  const cleanerEmail = String(formData.get("cleanerEmail") || "").trim();

  if (!propertyName || !unitCode || !address || !cleanerName || !cleanerEmail) {
    return { error: "Property and cleaner details are required." };
  }

  const sop = await prisma.sop.create({
    data: {
      companyId: user.companyId,
      name: sopName,
      description: "Uploaded during onboarding",
      steps: {
        create: [
          {
            section: "Pre-turnover prep",
            title: "Gather supplies & confirm checkout",
            instructions: "Confirm guest departure and load supply caddy.",
            sortOrder: 1,
          },
          {
            section: "Room-by-room",
            title: "Clean all rooms",
            instructions: "Follow room-by-room checklist for this property.",
            requiresPhoto: true,
            photoLabel: "Primary room photo",
            sortOrder: 2,
          },
          {
            section: "Safety and supply check",
            title: "Safety devices & supplies",
            instructions: "Verify detectors and restock kit.",
            sortOrder: 3,
          },
          {
            section: "Restock verification",
            title: "Restock consumables",
            instructions: "Bring amenities and linens to par.",
            sortOrder: 4,
          },
          {
            section: "Photo documentation",
            title: "Capture proof photos",
            instructions: "Upload required photo proofs.",
            requiresPhoto: true,
            photoLabel: "Final overview",
            sortOrder: 5,
          },
          {
            section: "Final walkthrough",
            title: "Final walkthrough",
            instructions: "Walk property and lock up.",
            sortOrder: 6,
          },
          {
            section: "Deep-clean cadence",
            title: "Deep-clean extras",
            instructions: "Perform deep-clean tasks on cadence.",
            isDeepClean: true,
            sortOrder: 7,
          },
          {
            section: "Exception handling",
            title: "Flag exceptions",
            instructions: "Escalate damage or misses.",
            isException: true,
            sortOrder: 8,
          },
          {
            section: "Completion sign-off",
            title: "Sign off",
            instructions: "Confirm completion for QA.",
            sortOrder: 9,
          },
        ],
      },
    },
  });

  const sow = await prisma.sowTemplate.create({
    data: {
      companyId: user.companyId,
      name: sowName,
      standardScope: "Full clean, linen change, restock, photo proof, walkthrough.",
      addOns: JSON.stringify(["Rush turnover", "Pet treatment"]),
      photoReqs: JSON.stringify(["Primary room photo", "Final overview"]),
      slaMinutes: 240,
      damageRules: "Escalate damage over $50.",
      missingItemRules: "Report missing items before departure.",
    },
  });

  const property = await prisma.property.create({
    data: {
      companyId: user.companyId,
      name: propertyName,
      unitCode,
      address,
      city: city || "Unknown",
      state: state || "NA",
      calendarUrl: calendarUrl || null,
      sopId: sop.id,
      sowTemplateId: sow.id,
    },
  });

  await prisma.teamMember.create({
    data: {
      companyId: user.companyId,
      name: cleanerName,
      email: cleanerEmail,
      role: "CLEANER",
      skills: JSON.stringify(["standard"]),
    },
  });

  if (calendarUrl) {
    await enqueueJob({
      companyId: user.companyId,
      type: "booking.sync",
      payload: {
        propertyId: property.id,
        guestName: "First Guest",
        externalId: `onboard-${Date.now()}`,
      },
    });
  } else {
    const windowStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
    const turnover = await prisma.turnover.create({
      data: {
        companyId: user.companyId,
        propertyId: property.id,
        sopId: sop.id,
        sowTemplateId: sow.id,
        windowStart,
        windowEnd,
        deadlineAt: windowEnd,
        status: "SCHEDULED",
      },
    });
    await runLeadTurnoverPipeline(turnover.id, user.companyId);
  }

  await prisma.company.update({
    where: { id: user.companyId },
    data: { onboardedAt: new Date() },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "onboarding.completed",
    entityType: "Company",
    entityId: user.companyId,
  });

  await processDueJobs(10);
  redirect("/dashboard");
}

export async function createPropertyAction(formData: FormData) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) return;

  const name = String(formData.get("name") || "").trim();
  const unitCode = String(formData.get("unitCode") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const bedrooms = Number(formData.get("bedrooms") || 1);
  const bathrooms = Number(formData.get("bathrooms") || 1);
  const sopId = String(formData.get("sopId") || "") || null;
  const sowTemplateId = String(formData.get("sowTemplateId") || "") || null;
  const ownerId = String(formData.get("ownerId") || "") || null;
  const calendarUrl = String(formData.get("calendarUrl") || "") || null;

  if (!name || !unitCode || !address) return;

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
      sopId,
      sowTemplateId,
      ownerId,
      calendarUrl,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.created",
    entityType: "Property",
    entityId: property.id,
  });

  revalidatePath("/properties");
  return;
}

export async function syncCalendarAction(formData: FormData) {
  const user = await requireUser({ permission: "turnovers:manage" });
  if (!user.companyId) return;
  const propertyId = String(formData.get("propertyId") || "");
  const hoursUntilCheckout = Number(formData.get("hoursUntilCheckout") || 6);

  await enqueueJob({
    companyId: user.companyId,
    type: "booking.sync",
    payload: {
      propertyId,
      externalId: `manual-${Date.now()}`,
      guestName: String(formData.get("guestName") || "Synced Guest"),
      checkOut: new Date(Date.now() + hoursUntilCheckout * 60 * 60 * 1000).toISOString(),
      nextCheckIn: new Date(Date.now() + (hoursUntilCheckout + 5) * 60 * 60 * 1000).toISOString(),
    },
  });
  await processDueJobs(5);
  revalidatePath("/turnovers");
  revalidatePath("/dashboard");
  revalidatePath("/properties");
  return;
}

export async function toggleChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  const item = await prisma.checklistItem.findUnique({
    where: { id },
    include: { turnover: true },
  });
  if (!item || item.turnover.companyId !== user.companyId) return;

  await prisma.checklistItem.update({
    where: { id },
    data: {
      completed: !item.completed,
      completedAt: !item.completed ? new Date() : null,
      completedById: !item.completed ? user.id : null,
    },
  });

  revalidatePath(`/turnovers/${item.turnoverId}`);
  revalidatePath("/qa");
  return;
}

export async function addPhotoAction(formData: FormData) {
  const user = await requireUser();
  const turnoverId = String(formData.get("turnoverId") || "");
  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId: user.companyId! },
  });
  if (!turnover || !label || !url) return;

  await prisma.photoSubmission.create({
    data: {
      turnoverId,
      label,
      url,
      uploadedById: user.id,
    },
  });

  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "PHOTO_VERIFICATION",
    title: `Verify photo: ${label}`,
    description: "New photo submitted — approve AI verification.",
    payload: { label },
  });

  revalidatePath(`/turnovers/${turnoverId}`);
  revalidatePath("/qa");
  return;
}

export async function createIssueAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  const turnoverId = String(formData.get("turnoverId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const severity = String(formData.get("severity") || "MEDIUM") as
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  const category = String(formData.get("category") || "damage");

  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId: user.companyId! },
  });
  if (!turnover || !title) return;

  const issue = await prisma.issue.create({
    data: {
      turnoverId,
      title,
      description,
      severity,
      category,
      reportedById: user.id,
      status: "OPEN",
    },
  });

  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "ISSUE_ESCALATION",
    title: `Escalate: ${title}`,
    description: "Approve escalation to vendor / ops.",
    payload: { issueId: issue.id, title, description, severity, category },
  });

  await writeAuditLog({
    companyId: user.companyId!,
    userId: user.id,
    action: "issue.created",
    entityType: "Issue",
    entityId: issue.id,
  });

  revalidatePath("/issues");
  revalidatePath(`/turnovers/${turnoverId}`);
  return;
}

export async function updateIssueStatusAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as
    | "OPEN"
    | "ESCALATED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "CLOSED";
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: { turnover: true },
  });
  if (!issue || issue.turnover.companyId !== user.companyId) return;

  await prisma.issue.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null,
    },
  });
  revalidatePath("/issues");
  return;
}

export async function assignCleanerAction(formData: FormData) {
  const user = await requireUser({ permission: "assignments:manage" });
  const turnoverId = String(formData.get("turnoverId") || "");
  const teamMemberId = String(formData.get("teamMemberId") || "");

  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId: user.companyId! },
  });
  if (!turnover) return;

  await prisma.cleanerAssignment.create({
    data: {
      turnoverId,
      teamMemberId,
      status: "assigned",
      notes: "Manually assigned",
    },
  });
  await prisma.turnover.update({
    where: { id: turnoverId },
    data: { status: "ASSIGNED" },
  });

  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "CLEANER_DISPATCH",
    title: "Dispatch assigned cleaner",
    description: "Send checklist, timing, and photo requirements.",
    payload: { teamMemberId },
  });

  revalidatePath("/assignments");
  revalidatePath("/turnovers");
  return;
}

export async function approveAgentAction(formData: FormData) {
  const user = await requireUser({ permission: "agents:approve" });
  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "approve");

  const action = await prisma.agentAction.findFirst({
    where: { id, companyId: user.companyId! },
  });
  if (!action) return;

  if (decision === "reject") {
    await prisma.agentAction.update({
      where: { id },
      data: { status: "REJECTED", approvedById: user.id, approvedAt: new Date() },
    });
  } else {
    await executeApprovedAction(id, user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/turnovers");
  revalidatePath("/qa");
  revalidatePath("/issues");
  revalidatePath("/inventory");
  revalidatePath("/owners");
  return;
}

export async function createSopAction(formData: FormData) {
  const user = await requireUser({ permission: "sops:manage" });
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!name) return;

  const sop = await prisma.sop.create({
    data: {
      companyId: user.companyId!,
      name,
      description,
      steps: {
        create: [
          {
            section: "Pre-turnover prep",
            title: "Prep supplies",
            instructions: "Load caddy and confirm access.",
            sortOrder: 1,
          },
          {
            section: "Room-by-room",
            title: "Clean rooms",
            instructions: "Complete room checklist.",
            requiresPhoto: true,
            photoLabel: "Room photo",
            sortOrder: 2,
          },
          {
            section: "Completion sign-off",
            title: "Sign off",
            instructions: "Confirm done.",
            sortOrder: 3,
          },
        ],
      },
    },
  });
  revalidatePath("/sops");
  return;
}

export async function createSowTemplateAction(formData: FormData) {
  const user = await requireUser({ permission: "sow:manage" });
  const name = String(formData.get("name") || "").trim();
  const standardScope = String(formData.get("standardScope") || "").trim();
  const slaMinutes = Number(formData.get("slaMinutes") || 240);
  if (!name || !standardScope) return;

  const tpl = await prisma.sowTemplate.create({
    data: {
      companyId: user.companyId!,
      name,
      standardScope,
      slaMinutes,
      addOns: JSON.stringify(
        String(formData.get("addOns") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      photoReqs: JSON.stringify(
        String(formData.get("photoReqs") || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
      damageRules: String(formData.get("damageRules") || "") || null,
      missingItemRules: String(formData.get("missingItemRules") || "") || null,
    },
  });
  revalidatePath("/sow-templates");
  return;
}

export async function addTeamMemberAction(formData: FormData) {
  const user = await requireUser({ permission: "settings:manage" });
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const role = String(formData.get("role") || "CLEANER") as Role;
  if (!name || !email) return;

  await prisma.teamMember.create({
    data: {
      companyId: user.companyId!,
      name,
      email,
      role,
      phone: String(formData.get("phone") || "") || null,
      skills: JSON.stringify(
        String(formData.get("skills") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    },
  });
  revalidatePath("/settings");
  revalidatePath("/assignments");
  return;
}

export async function updateInventoryAction(formData: FormData) {
  const user = await requireUser({ permission: "inventory:manage" });
  const id = String(formData.get("id") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const item = await prisma.inventoryItem.findFirst({
    where: { id, companyId: user.companyId! },
  });
  if (!item) return;
  await prisma.inventoryItem.update({
    where: { id },
    data: { quantity, lastRestockedAt: new Date() },
  });
  revalidatePath("/inventory");
  return;
}

export async function createInventoryAction(formData: FormData) {
  const user = await requireUser({ permission: "inventory:manage" });
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.inventoryItem.create({
    data: {
      companyId: user.companyId!,
      name,
      category: String(formData.get("category") || "supplies"),
      quantity: Number(formData.get("quantity") || 0),
      reorderLevel: Number(formData.get("reorderLevel") || 5),
      unit: String(formData.get("unit") || "each"),
      propertyId: String(formData.get("propertyId") || "") || null,
    },
  });
  revalidatePath("/inventory");
  return;
}

export async function createOwnerAction(formData: FormData) {
  const user = await requireUser({ permission: "owners:report" });
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  if (!name || !email) return;
  await prisma.owner.create({
    data: {
      companyId: user.companyId!,
      name,
      email,
      phone: String(formData.get("phone") || "") || null,
    },
  });
  revalidatePath("/owners");
  return;
}

export async function closeTurnoverAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  const turnoverId = String(formData.get("turnoverId") || "");
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId: user.companyId! },
    include: { checklist: true, photos: true, property: { include: { owner: true } } },
  });
  if (!turnover) return;

  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "CHECKLIST_QA",
    title: "Run final checklist QA",
    description: "Verify all checklist items before closeout.",
  });
  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "OWNER_UPDATE",
    title: "Send owner completion summary",
    description: "Draft and send turnover completion report to owner.",
  });

  // Auto-approve closeout path for demo completeness after explicit user intent
  const qa = await prisma.agentAction.findFirst({
    where: { turnoverId, agentType: "CHECKLIST_QA", status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "desc" },
  });
  const owner = await prisma.agentAction.findFirst({
    where: { turnoverId, agentType: "OWNER_UPDATE", status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "desc" },
  });
  if (qa) await executeApprovedAction(qa.id, user.id);
  if (owner) await executeApprovedAction(owner.id, user.id);

  await writeAuditLog({
    companyId: user.companyId!,
    userId: user.id,
    action: "turnover.closed",
    entityType: "Turnover",
    entityId: turnoverId,
  });

  revalidatePath(`/turnovers/${turnoverId}`);
  revalidatePath("/turnovers");
  revalidatePath("/dashboard");
  revalidatePath("/owners");
  return;
}

export async function processJobsAction() {
  const user = await requireUser({ permission: "settings:manage" });
  if (!can(user.role as Role, "settings:manage")) return;
  const results = await processDueJobs(25);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return;
}

export async function runPhotoVerificationAction(formData: FormData) {
  const user = await requireUser({ permission: "qa:review" });
  const turnoverId = String(formData.get("turnoverId") || "");
  await proposeAgentAction({
    companyId: user.companyId!,
    turnoverId,
    agentType: "PHOTO_VERIFICATION",
    title: "Run photo verification",
    description: "AI will score all submitted photos against requirements.",
  });
  const action = await prisma.agentAction.findFirst({
    where: { turnoverId, agentType: "PHOTO_VERIFICATION", status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "desc" },
  });
  // Keep behind approval — do not auto-execute
  revalidatePath("/qa");
  revalidatePath("/dashboard");
  return;
}
