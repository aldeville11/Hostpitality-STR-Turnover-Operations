"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addIssueComment,
  assignIssue,
  createIssue,
  createIssuesFromQaFailures,
  escalateIssue,
  updateIssueStatus,
  type IssueSource,
  type IssueStatus,
} from "@/lib/issues";

function revalidateIssuePaths(issueId?: string, turnoverId?: string) {
  revalidatePath("/issues");
  revalidatePath("/dashboard");
  revalidatePath("/turnovers");
  revalidatePath("/qa");
  revalidatePath("/properties");
  if (issueId) revalidatePath(`/issues/${issueId}`);
  if (turnoverId) {
    revalidatePath(`/turnovers/${turnoverId}`);
    revalidatePath(`/qa/${turnoverId}`);
  }
}

export async function createIssueAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title || !description) return { error: "Title and description are required" };

  const severity = String(formData.get("severity") || "MEDIUM");
  const category = String(formData.get("category") || "other");
  const source = (String(formData.get("source") || "MANUAL") as IssueSource) || "MANUAL";
  const propertyId = String(formData.get("propertyId") || "") || null;
  const turnoverId = String(formData.get("turnoverId") || "") || null;
  const qaInspectionId = String(formData.get("qaInspectionId") || "") || null;
  const assigneeVendorId = String(formData.get("assigneeVendorId") || "") || null;
  const blockingRaw = String(formData.get("blocking") || "");
  const blocking = blockingRaw === "1" || blockingRaw === "true" || blockingRaw === "on";
  const redirectTo = String(formData.get("redirectTo") || "");

  try {
    const issue = await createIssue({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      title,
      description,
      severity,
      category,
      source,
      propertyId,
      turnoverId,
      qaInspectionId,
      assigneeVendorId,
      blocking,
      ownerUserId: user.id,
      ownerName: user.name,
    });
    revalidateIssuePaths(issue.id, turnoverId ?? undefined);
    if (redirectTo === "stay") return { ok: true as const, issueId: issue.id };
    redirect(`/issues/${issue.id}`);
  } catch (err) {
    // redirect() throws; rethrow so Next can handle navigation
    if (err && typeof err === "object" && "digest" in err) throw err;
    return { error: err instanceof Error ? err.message : "Create failed" };
  }
}

export async function updateIssueStatusAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const issueId = String(formData.get("issueId") || "");
  const status = String(formData.get("status") || "") as IssueStatus;
  const note = String(formData.get("note") || "").trim() || undefined;
  if (!issueId || !status) return { error: "Status required" };

  try {
    await updateIssueStatus({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      issueId,
      status,
      note,
    });
    revalidateIssuePaths(issueId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function assignIssueAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const issueId = String(formData.get("issueId") || "");
  const assigneeVendorId = String(formData.get("assigneeVendorId") || "") || null;
  const ownerUserId = String(formData.get("ownerUserId") || "") || null;
  const note = String(formData.get("note") || "").trim() || undefined;
  if (!issueId) return { error: "Issue required" };

  try {
    await assignIssue({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      issueId,
      assigneeVendorId,
      ownerUserId: ownerUserId || undefined,
      note,
    });
    revalidateIssuePaths(issueId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Assign failed" };
  }
}

export async function escalateIssueAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const issueId = String(formData.get("issueId") || "");
  const note = String(formData.get("note") || "").trim() || undefined;
  if (!issueId) return { error: "Issue required" };

  try {
    await escalateIssue({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      issueId,
      note,
    });
    revalidateIssuePaths(issueId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Escalate failed" };
  }
}

export async function addIssueCommentAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const issueId = String(formData.get("issueId") || "");
  const body = String(formData.get("body") || "").trim();
  const visibility = (String(formData.get("visibility") || "INTERNAL") as
    | "INTERNAL"
    | "EXTERNAL") || "INTERNAL";
  if (!issueId || !body) return { error: "Comment required" };

  try {
    await addIssueComment({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      issueId,
      body,
      visibility,
    });
    revalidateIssuePaths(issueId);
    return { ok: true as const };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Comment failed" };
  }
}

export async function createIssuesFromQaAction(formData: FormData) {
  const user = await requireUser({ permission: "issues:manage" });
  if (!user.companyId) return { error: "No company" };

  const inspectionId = String(formData.get("inspectionId") || "");
  const turnoverId = String(formData.get("turnoverId") || "");
  if (!inspectionId) return { error: "Inspection required" };

  try {
    const ids = await createIssuesFromQaFailures({
      companyId: user.companyId,
      userId: user.id,
      actorName: user.name,
      inspectionId,
    });
    revalidateIssuePaths(ids[0], turnoverId || undefined);
    return { ok: true as const, count: ids.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create issues" };
  }
}
