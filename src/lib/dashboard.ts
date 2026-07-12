import { prisma } from "./db";
import { endOfDay, startOfDay } from "./utils";

const OPEN_ISSUE_STATUSES = ["OPEN", "TRIAGED", "ASSIGNED", "ESCALATED", "IN_PROGRESS"];
const ACTIVE_TURNOVER_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_QA",
  "NEEDS_REWORK",
  "BLOCKED",
  "OVERDUE",
];

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(companyId: string) {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    todaysTurnoversRaw,
    overdueTurnovers,
    openIssues,
    inventoryItems,
    recentTurnovers,
    vendors,
    ownerNotifiedRecent,
  ] = await Promise.all([
    prisma.turnover.findMany({
      where: {
        companyId,
        windowStart: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        property: true,
        vendor: true,
        issues: { where: { status: { in: OPEN_ISSUE_STATUSES } } },
      },
      orderBy: { windowStart: "asc" },
    }),
    prisma.turnover.findMany({
      where: {
        companyId,
        OR: [
          { status: "OVERDUE" },
          {
            deadlineAt: { lt: now },
            status: { in: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "DRAFT"] },
          },
        ],
      },
      include: {
        property: true,
        vendor: true,
        issues: { where: { status: { in: OPEN_ISSUE_STATUSES } } },
      },
      orderBy: { deadlineAt: "asc" },
      take: 12,
    }),
    prisma.issue.findMany({
      where: {
        companyId,
        status: { in: OPEN_ISSUE_STATUSES },
      },
      include: {
        turnover: { include: { property: true } },
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.inventoryItem.findMany({
      where: { companyId },
      include: { property: true },
      orderBy: { name: "asc" },
    }),
    prisma.turnover.findMany({
      where: {
        companyId,
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        status: true,
        photosRequired: true,
        photosUploaded: true,
        photosVerified: true,
        ownerNotifiedAt: true,
        vendorId: true,
        propertyId: true,
        windowStart: true,
        deadlineAt: true,
      },
    }),
    prisma.vendor.findMany({
      where: { companyId, active: true, type: { in: ["CLEANER", "COORDINATOR"] } },
      include: {
        assignments: {
          where: { status: { in: ACTIVE_TURNOVER_STATUSES } },
          include: { property: true },
          orderBy: { windowStart: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.turnover.count({
      where: {
        companyId,
        ownerNotifiedAt: { not: null },
        updatedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const priorityRank: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
  };

  const todaysTurnovers = [...todaysTurnoversRaw].sort((a, b) => {
    const pr = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    if (pr !== 0) return pr;
    return a.windowStart.getTime() - b.windowStart.getTime();
  });

  // Auto-mark overdue in memory for display accuracy if status wasn't updated by job yet
  const overdue = overdueTurnovers.map((t) => ({
    ...t,
    status: t.status === "OVERDUE" ? t.status : "OVERDUE",
    isEscalated: Boolean(t.escalatedAt) || t.issues.some((i) => i.status === "ESCALATED"),
  }));

  const inventoryAlerts = inventoryItems.filter((item) => item.quantity <= item.reorderLevel);

  const completedCount = recentTurnovers.filter((t) => t.status === "COMPLETED").length;
  const totalRecent = recentTurnovers.length;
  const completionRate = totalRecent === 0 ? 0 : Math.round((completedCount / totalRecent) * 100);

  const photoStats = {
    turnoversTracked: recentTurnovers.filter((t) => t.photosRequired > 0).length,
    required: recentTurnovers.reduce((sum, t) => sum + t.photosRequired, 0),
    uploaded: recentTurnovers.reduce((sum, t) => sum + t.photosUploaded, 0),
    verified: recentTurnovers.reduce((sum, t) => sum + t.photosVerified, 0),
    missingEvidence: recentTurnovers.filter(
      (t) =>
        ACTIVE_TURNOVER_STATUSES.includes(t.status) &&
        t.photosUploaded < t.photosRequired
    ).length,
    awaitingVerification: recentTurnovers.filter(
      (t) => t.photosUploaded > 0 && t.photosVerified < t.photosUploaded
    ).length,
  };

  const todaysPhotoGaps = todaysTurnovers.filter(
    (t) => t.photosUploaded < t.photosRequired && t.status !== "COMPLETED"
  );

  const ownerNotifications = {
    sentLast30Days: ownerNotifiedRecent,
    pendingToday: todaysTurnovers.filter(
      (t) => t.status === "COMPLETED" && !t.ownerNotifiedAt
    ).length,
    sentToday: todaysTurnovers.filter((t) => Boolean(t.ownerNotifiedAt)).length,
    recent: todaysTurnovers
      .filter((t) => t.ownerNotifiedAt)
      .map((t) => ({
        id: t.id,
        propertyName: t.property.name,
        unitCode: t.property.unitCode,
        notifiedAt: t.ownerNotifiedAt!,
      })),
  };

  const assignmentRows = vendors.map((vendor) => ({
    id: vendor.id,
    name: vendor.name,
    type: vendor.type,
    activeJobs: vendor.assignments.length,
    jobs: vendor.assignments.map((a) => ({
      id: a.id,
      propertyName: a.property.name,
      unitCode: a.property.unitCode,
      status: a.status,
      windowStart: a.windowStart,
      priority: a.priority,
    })),
  }));

  const unassignedToday = todaysTurnovers.filter((t) => !t.vendorId);

  const summary = {
    todaysCount: todaysTurnovers.length,
    overdueCount: overdue.length,
    openIssuesCount: openIssues.length,
    inventoryAlertsCount: inventoryAlerts.length,
    completionRate,
    ownerNotificationsSent: ownerNotifiedRecent,
    photoGapsToday: todaysPhotoGaps.length,
    activeCleaners: assignmentRows.filter((a) => a.activeJobs > 0).length,
  };

  return {
    summary,
    todaysTurnovers,
    overdue,
    openIssues,
    inventoryAlerts,
    photoStats,
    todaysPhotoGaps,
    completion: {
      rate: completionRate,
      completed: completedCount,
      total: totalRecent,
      inProgress: recentTurnovers.filter((t) =>
        ["ASSIGNED", "IN_PROGRESS", "READY_FOR_QA"].includes(t.status)
      ).length,
      overdue: recentTurnovers.filter((t) => t.status === "OVERDUE").length,
    },
    assignments: {
      cleaners: assignmentRows,
      unassignedToday,
    },
    ownerNotifications,
  };
}

export function priorityTone(priority: string): "neutral" | "warning" | "danger" | "accent" {
  switch (priority) {
    case "URGENT":
      return "danger";
    case "HIGH":
      return "warning";
    case "LOW":
      return "neutral";
    default:
      return "accent";
  }
}

export function turnoverStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "OVERDUE":
    case "BLOCKED":
    case "ISSUES_OPEN":
      return "danger";
    case "IN_PROGRESS":
    case "READY_FOR_QA":
      return "info";
    case "NEEDS_REWORK":
      return "warning";
    case "ASSIGNED":
      return "accent";
    case "DRAFT":
      return "neutral";
    default:
      return "neutral";
  }
}

export function severityTone(severity: string): "neutral" | "warning" | "danger" {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "neutral";
}
