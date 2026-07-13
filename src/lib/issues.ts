import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";
import {
  validatePropertyId,
  validateQaInspectionId,
  validateTurnoverId,
  validateVendorId,
} from "./tenant";

export const ISSUE_STATUSES = [
  "OPEN",
  "TRIAGED",
  "ASSIGNED",
  "RESOLVED",
  "VERIFIED",
  "CLOSED",
  "ESCALATED",
] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  OPEN: "Open",
  TRIAGED: "Triaged",
  ASSIGNED: "Assigned",
  RESOLVED: "Resolved",
  VERIFIED: "Verified",
  CLOSED: "Closed",
  ESCALATED: "Escalated",
};

export const OPEN_ISSUE_STATUSES: IssueStatus[] = [
  "OPEN",
  "TRIAGED",
  "ASSIGNED",
  "ESCALATED",
];

export const ISSUE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_CATEGORIES = [
  "damage",
  "missing",
  "qa",
  "access",
  "clean_miss",
  "restock",
  "other",
] as const;
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export const ISSUE_CATEGORY_LABELS: Record<string, string> = {
  damage: "Damage",
  missing: "Missing item",
  qa: "QA failure",
  access: "Access",
  clean_miss: "Clean miss",
  restock: "Restock",
  other: "Other",
};

export const ISSUE_SOURCES = ["MANUAL", "QA_FAILURE", "TURNOVER_BLOCK"] as const;
export type IssueSource = (typeof ISSUE_SOURCES)[number];

export const ISSUE_SOURCE_LABELS: Record<IssueSource, string> = {
  MANUAL: "Manual entry",
  QA_FAILURE: "QA failure",
  TURNOVER_BLOCK: "Turnover block",
};

export const ISSUE_SEVERITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export function issueSeverityLabel(severity: string) {
  return ISSUE_SEVERITY_LABELS[severity] ?? severity;
}

export function issueCategoryLabel(category: string) {
  return ISSUE_CATEGORY_LABELS[category] ?? category;
}

export function issueSourceLabel(source: string) {
  return ISSUE_SOURCE_LABELS[source as IssueSource] ?? source;
}

export function formatIssueDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export type IssueListItem = Awaited<ReturnType<typeof listIssues>>[number];
export type IssueDetailPayload = NonNullable<Awaited<ReturnType<typeof getIssueDetail>>>;
export type IssueDetail = IssueDetailPayload["issue"];
export type IssueCommentDto = IssueDetail["comments"][number];
export type IssueEventDto = IssueDetail["events"][number];

const TRANSITIONS: Record<string, IssueStatus[]> = {
  OPEN: ["TRIAGED", "ASSIGNED", "ESCALATED", "CLOSED"],
  TRIAGED: ["ASSIGNED", "ESCALATED", "OPEN", "CLOSED"],
  ASSIGNED: ["RESOLVED", "ESCALATED", "TRIAGED", "OPEN"],
  ESCALATED: ["ASSIGNED", "TRIAGED", "RESOLVED", "CLOSED"],
  RESOLVED: ["VERIFIED", "ASSIGNED", "CLOSED"],
  VERIFIED: ["CLOSED", "ASSIGNED"],
  CLOSED: ["OPEN"],
};

export function canTransitionIssue(from: string, to: string) {
  return (TRANSITIONS[from] ?? []).includes(to as IssueStatus);
}

export function nextIssueStatuses(from: string): IssueStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function issueStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  switch (status) {
    case "CLOSED":
    case "VERIFIED":
      return "success";
    case "RESOLVED":
      return "accent";
    case "ESCALATED":
      return "danger";
    case "ASSIGNED":
    case "TRIAGED":
      return "info";
    case "OPEN":
      return "warning";
    default:
      return "neutral";
  }
}

export function slaHoursForSeverity(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 12;
    case "MEDIUM":
      return 24;
    default:
      return 48;
  }
}

export function computeIssueSla(issue: {
  createdAt: Date;
  dueAt: Date | null;
  escalatedAt: Date | null;
  status: string;
  severity: string;
  blocking: boolean;
}) {
  const now = Date.now();
  const dueAt =
    issue.dueAt ??
    new Date(issue.createdAt.getTime() + slaHoursForSeverity(issue.severity) * 60 * 60 * 1000);
  const ageMs = now - issue.createdAt.getTime();
  const ageHours = Math.max(0, Math.round(ageMs / (60 * 60 * 1000)));
  const overdue =
    !["RESOLVED", "VERIFIED", "CLOSED"].includes(issue.status) && dueAt.getTime() < now;
  const hoursToDue = Math.round((dueAt.getTime() - now) / (60 * 60 * 1000));
  const escalationRisk =
    !issue.escalatedAt &&
    !["RESOLVED", "VERIFIED", "CLOSED"].includes(issue.status) &&
    (overdue || hoursToDue <= 2 || (issue.blocking && hoursToDue <= 6));

  const ageLabel =
    ageHours < 1 ? "<1h" : ageHours < 48 ? `${ageHours}h` : `${Math.round(ageHours / 24)}d`;

  return {
    dueAt,
    ageHours,
    ageLabel,
    overdue,
    isOverdue: overdue,
    escalationRisk,
    hoursToDue,
  };
}

async function recordIssueEvent(input: {
  issueId: string;
  type: string;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string;
  actorId?: string | null;
  actorName?: string | null;
}) {
  return prisma.issueEvent.create({
    data: {
      issueId: input.issueId,
      type: input.type,
      fromValue: input.fromValue ?? null,
      toValue: input.toValue ?? null,
      note: input.note,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export async function listIssues(
  companyId: string,
  filters?: {
    status?: string;
    severity?: string;
    propertyId?: string;
    from?: string;
    to?: string;
    q?: string;
    blocking?: boolean;
  }
) {
  const fromDate = filters?.from ? new Date(filters.from) : undefined;
  const toDate = filters?.to ? new Date(filters.to) : undefined;
  if (toDate) toDate.setHours(23, 59, 59, 999);

  const issues = await prisma.issue.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.severity ? { severity: filters.severity } : {}),
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters?.blocking ? { blocking: true } : {}),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
      ...(filters?.q
        ? {
            OR: [
              { title: { contains: filters.q } },
              { description: { contains: filters.q } },
              { ownerName: { contains: filters.q } },
              { assigneeName: { contains: filters.q } },
              { property: { name: { contains: filters.q } } },
            ],
          }
        : {}),
    },
    include: {
      property: { select: { id: true, name: true, unitCode: true, city: true } },
      turnover: {
        select: {
          id: true,
          status: true,
          priority: true,
          deadlineAt: true,
          property: { select: { name: true, unitCode: true } },
        },
      },
      assignee: { select: { id: true, name: true, type: true } },
      qaInspection: { select: { id: true, status: true } },
    },
    orderBy: [{ blocking: "desc" }, { createdAt: "desc" }],
    take: 120,
  });

  return issues.map((issue) => {
    const sla = computeIssueSla(issue);
    return {
      ...issue,
      photos: parseJson<string[]>(issue.photosJson, []),
      sla,
    };
  });
}

export async function getIssueDetail(companyId: string, issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, companyId },
    include: {
      property: {
        include: {
          sop: true,
          sow: true,
          defaultVendor: true,
        },
      },
      turnover: {
        include: {
          property: true,
          vendor: true,
          sop: true,
          sow: true,
          checklistItems: { orderBy: { sortOrder: "asc" }, take: 8 },
        },
      },
      qaInspection: {
        include: {
          items: { where: { result: "FAIL" }, orderBy: { sortOrder: "asc" } },
          photos: { where: { result: "FAIL" }, orderBy: { sortOrder: "asc" } },
        },
      },
      assignee: true,
      comments: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!issue) return null;

  const [vendors, users, properties, turnovers] = await Promise.all([
    prisma.vendor.findMany({
      where: { companyId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.turnover.findMany({
      where: {
        companyId,
        status: {
          in: [
            "SCHEDULED",
            "ASSIGNED",
            "IN_PROGRESS",
            "READY_FOR_QA",
            "NEEDS_REWORK",
            "BLOCKED",
            "OVERDUE",
          ],
        },
      },
      select: {
        id: true,
        status: true,
        propertyId: true,
        property: { select: { name: true, unitCode: true } },
        windowStart: true,
      },
      orderBy: { windowStart: "desc" },
      take: 40,
    }),
  ]);

  return {
    issue: {
      ...issue,
      photos: parseJson<string[]>(issue.photosJson, []),
      sla: computeIssueSla(issue),
      allowedNextStatuses: nextIssueStatuses(issue.status),
    },
    vendors,
    users,
    properties,
    turnovers,
  };
}

export async function createIssue(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  title: string;
  description: string;
  severity?: string;
  category?: string;
  source?: IssueSource;
  propertyId?: string | null;
  turnoverId?: string | null;
  qaInspectionId?: string | null;
  blocking?: boolean;
  ownerUserId?: string | null;
  ownerName?: string | null;
  assigneeVendorId?: string | null;
  photos?: string[];
  dueAt?: Date | null;
}) {
  let propertyId = input.propertyId ?? null;
  let assigneeName: string | null = null;

  propertyId = await validatePropertyId(input.companyId, propertyId);
  const turnoverId = await validateTurnoverId(input.companyId, input.turnoverId ?? null);
  const qaInspectionId = await validateQaInspectionId(
    input.companyId,
    input.qaInspectionId ?? null
  );

  if (turnoverId && !propertyId) {
    const turnover = await prisma.turnover.findFirst({
      where: { id: turnoverId, companyId: input.companyId },
      select: { propertyId: true },
    });
    propertyId = turnover?.propertyId ?? null;
  }

  if (input.assigneeVendorId) {
    await validateVendorId(input.companyId, input.assigneeVendorId);
    const vendor = await prisma.vendor.findFirst({
      where: { id: input.assigneeVendorId, companyId: input.companyId },
    });
    assigneeName = vendor?.name ?? null;
  }

  const severity = input.severity ?? "MEDIUM";
  const dueAt =
    input.dueAt ??
    new Date(Date.now() + slaHoursForSeverity(severity) * 60 * 60 * 1000);

  const initialStatus: IssueStatus = input.assigneeVendorId ? "ASSIGNED" : "OPEN";

  const issue = await prisma.issue.create({
    data: {
      companyId: input.companyId,
      propertyId,
      turnoverId,
      qaInspectionId,
      title: input.title.trim(),
      description: input.description.trim(),
      severity,
      category: input.category ?? "other",
      source: input.source ?? "MANUAL",
      blocking: Boolean(input.blocking),
      status: initialStatus,
      ownerUserId: input.ownerUserId ?? input.userId,
      ownerName: input.ownerName ?? input.actorName ?? null,
      assigneeVendorId: input.assigneeVendorId ?? null,
      assigneeName,
      dueAt,
      photosJson: JSON.stringify(input.photos ?? []),
    },
  });

  await recordIssueEvent({
    issueId: issue.id,
    type: "STATUS",
    fromValue: null,
    toValue: initialStatus,
    note: `Created from ${input.source ?? "MANUAL"}`,
    actorId: input.userId,
    actorName: input.actorName,
  });

  if (input.assigneeVendorId) {
    await recordIssueEvent({
      issueId: issue.id,
      type: "ASSIGNMENT",
      fromValue: null,
      toValue: assigneeName,
      note: "Initial assignment",
      actorId: input.userId,
      actorName: input.actorName,
    });
  }

  if (input.blocking && turnoverId) {
    const turnover = await prisma.turnover.findFirst({
      where: { id: turnoverId, companyId: input.companyId },
    });
    if (turnover && !["COMPLETED", "BLOCKED"].includes(turnover.status)) {
      await prisma.turnover.update({
        where: { id: turnover.id },
        data: { escalatedAt: turnover.escalatedAt ?? new Date() },
      });
    }
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "issue.created",
    entityType: "Issue",
    entityId: issue.id,
    metadata: {
      source: input.source,
      turnoverId: input.turnoverId,
      qaInspectionId: input.qaInspectionId,
      blocking: input.blocking,
    },
  });

  return issue;
}

export async function updateIssueStatus(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  issueId: string;
  status: IssueStatus;
  note?: string;
}) {
  const issue = await prisma.issue.findFirst({
    where: { id: input.issueId, companyId: input.companyId },
  });
  if (!issue) throw new Error("Issue not found");
  if (!canTransitionIssue(issue.status, input.status)) {
    throw new Error(`Cannot move from ${issue.status} to ${input.status}`);
  }

  const data: Record<string, unknown> = { status: input.status };
  if (input.status === "RESOLVED") data.resolvedAt = new Date();
  if (input.status === "VERIFIED") {
    data.verifiedAt = new Date();
    if (!issue.resolvedAt) data.resolvedAt = new Date();
  }
  if (input.status === "CLOSED") {
    data.closedAt = new Date();
    if (!issue.resolvedAt) data.resolvedAt = new Date();
    if (!issue.verifiedAt) data.verifiedAt = new Date();
  }
  if (input.status === "ESCALATED") data.escalatedAt = new Date();
  if (["OPEN", "TRIAGED", "ASSIGNED"].includes(input.status) && issue.status === "CLOSED") {
    data.closedAt = null;
    data.resolvedAt = null;
    data.verifiedAt = null;
  }

  const updated = await prisma.issue.update({
    where: { id: issue.id },
    data,
  });

  await recordIssueEvent({
    issueId: issue.id,
    type: "STATUS",
    fromValue: issue.status,
    toValue: input.status,
    note: input.note,
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "issue.status_changed",
    entityType: "Issue",
    entityId: issue.id,
    metadata: { from: issue.status, to: input.status, note: input.note },
  });

  return updated;
}

export async function assignIssue(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  issueId: string;
  assigneeVendorId: string | null;
  ownerUserId?: string | null;
  note?: string;
}) {
  const issue = await prisma.issue.findFirst({
    where: { id: input.issueId, companyId: input.companyId },
  });
  if (!issue) throw new Error("Issue not found");

  const vendor = input.assigneeVendorId
    ? await prisma.vendor.findFirst({
        where: { id: input.assigneeVendorId, companyId: input.companyId },
      })
    : null;
  if (input.assigneeVendorId && !vendor) throw new Error("Assignee not found");

  let ownerName = issue.ownerName;
  const ownerUserId = input.ownerUserId !== undefined ? input.ownerUserId : issue.ownerUserId;
  if (input.ownerUserId) {
    const owner = await prisma.user.findFirst({
      where: { id: input.ownerUserId, companyId: input.companyId },
    });
    ownerName = owner?.name ?? ownerName;
  }

  const nextStatus =
    vendor && ["OPEN", "TRIAGED", "ESCALATED"].includes(issue.status)
      ? "ASSIGNED"
      : !vendor && issue.status === "ASSIGNED"
        ? "TRIAGED"
        : issue.status;

  const updated = await prisma.issue.update({
    where: { id: issue.id },
    data: {
      assigneeVendorId: vendor?.id ?? null,
      assigneeName: vendor?.name ?? null,
      ownerUserId,
      ownerName,
      status: nextStatus,
    },
  });

  await recordIssueEvent({
    issueId: issue.id,
    type: "ASSIGNMENT",
    fromValue: issue.assigneeName,
    toValue: vendor?.name ?? null,
    note: input.note ?? (vendor ? "Reassigned" : "Unassigned"),
    actorId: input.userId,
    actorName: input.actorName,
  });

  if (nextStatus !== issue.status) {
    await recordIssueEvent({
      issueId: issue.id,
      type: "STATUS",
      fromValue: issue.status,
      toValue: nextStatus,
      note: "Status updated with assignment",
      actorId: input.userId,
      actorName: input.actorName,
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "issue.assigned",
    entityType: "Issue",
    entityId: issue.id,
    metadata: {
      from: issue.assigneeVendorId,
      to: vendor?.id ?? null,
      status: nextStatus,
    },
  });

  return updated;
}

export async function escalateIssue(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  issueId: string;
  note?: string;
}) {
  const issue = await prisma.issue.findFirst({
    where: { id: input.issueId, companyId: input.companyId },
  });
  if (!issue) throw new Error("Issue not found");
  if (["CLOSED", "VERIFIED"].includes(issue.status)) {
    throw new Error("Cannot escalate a closed/verified issue");
  }

  const updated = await prisma.issue.update({
    where: { id: issue.id },
    data: {
      status: "ESCALATED",
      escalatedAt: new Date(),
      blocking: true,
    },
  });

  await recordIssueEvent({
    issueId: issue.id,
    type: "ESCALATION",
    fromValue: issue.status,
    toValue: "ESCALATED",
    note: input.note ?? "Escalated",
    actorId: input.userId,
    actorName: input.actorName,
  });

  if (issue.turnoverId) {
    await prisma.turnover.updateMany({
      where: { id: issue.turnoverId, companyId: input.companyId },
      data: { escalatedAt: new Date() },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "issue.escalated",
    entityType: "Issue",
    entityId: issue.id,
    metadata: { note: input.note },
  });

  return updated;
}

export async function addIssueComment(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  issueId: string;
  body: string;
  visibility?: "INTERNAL" | "EXTERNAL";
}) {
  const issue = await prisma.issue.findFirst({
    where: { id: input.issueId, companyId: input.companyId },
  });
  if (!issue) throw new Error("Issue not found");
  if (!input.body.trim()) throw new Error("Comment required");

  const comment = await prisma.issueComment.create({
    data: {
      issueId: issue.id,
      body: input.body.trim(),
      visibility: input.visibility ?? "INTERNAL",
      actorId: input.userId,
      actorName: input.actorName ?? null,
    },
  });

  await recordIssueEvent({
    issueId: issue.id,
    type: "COMMENT",
    toValue: input.visibility ?? "INTERNAL",
    note: input.body.trim().slice(0, 120),
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "issue.commented",
    entityType: "Issue",
    entityId: issue.id,
    metadata: { visibility: input.visibility ?? "INTERNAL" },
  });

  return comment;
}

export async function createIssuesFromQaFailures(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  inspectionId: string;
}) {
  const inspection = await prisma.qaInspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    include: {
      items: { where: { result: "FAIL" } },
      photos: { where: { result: "FAIL" } },
      turnover: true,
    },
  });
  if (!inspection) throw new Error("Inspection not found");

  const created = [];
  for (const item of inspection.items) {
    const issue = await createIssue({
      companyId: input.companyId,
      userId: input.userId,
      actorName: input.actorName,
      title: `QA fail: ${item.title}`,
      description: item.comment || `Checklist item failed QA in section ${item.section}.`,
      severity: "MEDIUM",
      category: "qa",
      source: "QA_FAILURE",
      propertyId: inspection.turnover.propertyId,
      turnoverId: inspection.turnoverId,
      qaInspectionId: inspection.id,
      blocking: true,
    });
    created.push(issue.id);
  }
  for (const photo of inspection.photos) {
    const issue = await createIssue({
      companyId: input.companyId,
      userId: input.userId,
      actorName: input.actorName,
      title: `QA photo fail: ${photo.label}`,
      description: photo.comment || "Photo proof failed QA review.",
      severity: "MEDIUM",
      category: "qa",
      source: "QA_FAILURE",
      propertyId: inspection.turnover.propertyId,
      turnoverId: inspection.turnoverId,
      qaInspectionId: inspection.id,
      blocking: true,
      photos: [photo.label],
    });
    created.push(issue.id);
  }
  return created;
}
