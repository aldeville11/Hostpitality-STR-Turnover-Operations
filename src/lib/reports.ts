import { prisma } from "./db";
import { endOfDay, startOfDay } from "./utils";
import {
  COMPANY_WIDE_SCOPE,
  composePropertyIdFilter,
  propertyScopeWhere,
  type AccessScope,
} from "./access-scope";

export const REPORT_VIEWS = ["overview", "property", "qa", "cleaners"] as const;
export type ReportView = (typeof REPORT_VIEWS)[number];

export const REPORT_VIEW_LABELS: Record<ReportView, string> = {
  overview: "Operations overview",
  property: "Property performance",
  qa: "QA & issues",
  cleaners: "Cleaner performance",
};

export const REPORT_VIEW_DESCRIPTIONS: Record<ReportView, string> = {
  overview: "Company-wide turnover volume, on-time completion, QA pass rate, and cleaner utilization.",
  property: "Per-property volume, on-time rate, issue rate, QA failures, and restock signals.",
  qa: "Inspection outcomes, rework and reinspection rates, failure categories, and issue mix.",
  cleaners: "Cleaner workload, completion, rework, SLA adherence, and utilization.",
};

export type ReportCategory = "operations" | "quality" | "workforce";

export const REPORT_VIEW_CATEGORIES: Record<ReportView, ReportCategory> = {
  overview: "operations",
  property: "operations",
  qa: "quality",
  cleaners: "workforce",
};

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  operations: "Operations",
  quality: "Quality",
  workforce: "Workforce",
};

export function formatReportPeriod(from: Date | string, to: Date | string) {
  const fmt = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export type ReportFilters = {
  from?: string;
  to?: string;
  propertyId?: string;
  cleanerId?: string;
  status?: string;
};

export type TrendPoint = {
  key: string;
  label: string;
  value: number;
  secondary?: number;
};

function parseDateInput(value?: string, end = false) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return end ? endOfDay(d) : startOfDay(d);
}

export function defaultReportRange() {
  const to = endOfDay();
  const from = startOfDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function parseReportFilters(
  searchParams: Record<string, string | string[] | undefined>
): ReportFilters {
  const pick = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" && v ? v : undefined;
  };
  const defaults = defaultReportRange();
  return {
    from: pick("from") ?? defaults.from,
    to: pick("to") ?? defaults.to,
    propertyId: pick("propertyId"),
    cleanerId: pick("cleanerId"),
    status: pick("status"),
  };
}

export function resolveReportRange(filters: ReportFilters) {
  const defaults = defaultReportRange();
  const from = parseDateInput(filters.from ?? defaults.from, false)!;
  const to = parseDateInput(filters.to ?? defaults.to, true)!;
  return { from, to };
}

export function isReportView(value: string): value is ReportView {
  return (REPORT_VIEWS as readonly string[]).includes(value);
}

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function formatPct(part: number, whole: number) {
  if (!whole) return "—";
  return `${pct(part, whole)}%`;
}

export function averageHours(values: number[]) {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
) {
  const escape = (cell: string | number | null | undefined) => {
    const raw = cell == null ? "" : String(cell);
    if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
    return raw;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join(
    "\n"
  );
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function completionAt(turnover: {
  status: string;
  updatedAt: Date;
  statusEvents: Array<{ toStatus: string; createdAt: Date }>;
}) {
  if (turnover.status !== "COMPLETED") return null;
  const event = [...turnover.statusEvents]
    .reverse()
    .find((e) => e.toStatus === "COMPLETED");
  return event?.createdAt ?? turnover.updatedAt;
}

function isOnTime(turnover: {
  status: string;
  deadlineAt: Date;
  updatedAt: Date;
  statusEvents: Array<{ toStatus: string; createdAt: Date }>;
}) {
  const doneAt = completionAt(turnover);
  if (!doneAt) return false;
  return doneAt.getTime() <= turnover.deadlineAt.getTime();
}

export async function getReportFilterOptions(
  companyId: string,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const [properties, cleaners] = await Promise.all([
    prisma.property.findMany({
      where: { companyId, active: true, ...propertyScopeWhere(scope) },
      select: { id: true, name: true, unitCode: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({
      where: { companyId, active: true, type: { in: ["CLEANER", "COORDINATOR"] } },
      select: { id: true, name: true, type: true, capacity: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { properties, cleaners };
}

async function loadReportSource(
  companyId: string,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const { from, to } = resolveReportRange(filters);

  const ISSUE_STATUSES = new Set([
    "OPEN",
    "TRIAGED",
    "ASSIGNED",
    "ESCALATED",
    "RESOLVED",
    "VERIFIED",
    "CLOSED",
    "IN_PROGRESS",
  ]);
  const TURNOVER_STATUSES = new Set([
    "DRAFT",
    "SCHEDULED",
    "ASSIGNED",
    "IN_PROGRESS",
    "READY_FOR_QA",
    "NEEDS_REWORK",
    "COMPLETED",
    "BLOCKED",
    "OVERDUE",
    "CANCELLED",
  ]);

  const turnoverStatusFilter = filters.status && TURNOVER_STATUSES.has(filters.status)
    ? { status: filters.status }
    : { status: { not: "CANCELLED" as const } };
  const issueStatusFilter =
    filters.status && ISSUE_STATUSES.has(filters.status)
      ? { status: filters.status }
      : {};

  const propertyFilter = composePropertyIdFilter(scope, filters.propertyId);
  if (propertyFilter.kind === "empty") {
    return {
      from,
      to,
      turnovers: [],
      inspections: [],
      issues: [],
      inventory: [],
      vendors: [],
    };
  }

  const turnoverWhere = {
    companyId,
    ...propertyFilter.where,
    windowStart: { gte: from, lte: to },
    ...(filters.cleanerId ? { vendorId: filters.cleanerId } : {}),
    ...turnoverStatusFilter,
  };

  const [turnovers, inspections, issues, inventory, vendors] = await Promise.all([
    prisma.turnover.findMany({
      where: turnoverWhere,
      include: {
        property: { select: { id: true, name: true, unitCode: true, city: true } },
        vendor: { select: { id: true, name: true, capacity: true, type: true } },
        statusEvents: {
          where: { toStatus: { in: ["COMPLETED", "NEEDS_REWORK", "READY_FOR_QA"] } },
          orderBy: { createdAt: "asc" },
        },
        checklistItems: {
          select: { id: true, section: true, title: true, completed: true },
        },
        qaInspections: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            createdAt: true,
          },
        },
        issues: {
          select: {
            id: true,
            status: true,
            category: true,
            severity: true,
            createdAt: true,
            resolvedAt: true,
            closedAt: true,
          },
        },
      },
      orderBy: { windowStart: "asc" },
    }),
    prisma.qaInspection.findMany({
      where: {
        companyId,
        createdAt: { gte: from, lte: to },
        turnover: {
          ...propertyFilter.where,
          ...(filters.cleanerId ? { vendorId: filters.cleanerId } : {}),
        },
      },
      include: {
        items: { select: { section: true, title: true, result: true } },
        photos: { select: { label: true, result: true } },
        turnover: {
          select: {
            id: true,
            propertyId: true,
            vendorId: true,
            property: { select: { id: true, name: true, unitCode: true } },
            vendor: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.issue.findMany({
      where: {
        companyId,
        ...propertyFilter.where,
        createdAt: { gte: from, lte: to },
        ...(filters.cleanerId
          ? {
              OR: [
                { assigneeVendorId: filters.cleanerId },
                { turnover: { vendorId: filters.cleanerId } },
              ],
            }
          : {}),
        ...issueStatusFilter,
      },
      include: {
        property: { select: { id: true, name: true, unitCode: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryItem.findMany({
      where: {
        companyId,
        ...propertyFilter.where,
      },
      select: {
        id: true,
        name: true,
        category: true,
        quantity: true,
        reorderLevel: true,
        propertyId: true,
        property: { select: { id: true, name: true, unitCode: true } },
      },
    }),
    prisma.vendor.findMany({
      where: {
        companyId,
        active: true,
        type: { in: ["CLEANER", "COORDINATOR"] },
        ...(filters.cleanerId ? { id: filters.cleanerId } : {}),
      },
      select: { id: true, name: true, capacity: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { from, to, turnovers, inspections, issues, inventory, vendors };
}

function buildDailyTrend(
  from: Date,
  to: Date,
  points: Array<{ at: Date; value?: number; secondary?: number }>
) {
  const map = new Map<string, { value: number; secondary: number }>();
  const cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor.getTime() <= end.getTime()) {
    map.set(dayKey(cursor), { value: 0, secondary: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const p of points) {
    const key = dayKey(p.at);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.value += p.value ?? 1;
    bucket.secondary += p.secondary ?? 0;
  }
  return Array.from(map.entries()).map(([key, v]) => ({
    key,
    label: dayLabel(new Date(`${key}T12:00:00`)),
    value: v.value,
    secondary: v.secondary,
  }));
}

export async function getReportingDashboard(
  companyId: string,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const { from, to, turnovers, inspections, issues, vendors } = await loadReportSource(
    companyId,
    filters,
    scope
  );

  const completed = turnovers.filter((t) => t.status === "COMPLETED");
  const onTime = completed.filter((t) => isOnTime(t));
  const decided = inspections.filter((i) =>
    ["APPROVED", "REJECTED", "NEEDS_REWORK"].includes(i.status)
  );
  const approved = decided.filter((i) => i.status === "APPROVED");
  const openIssues = issues.filter((i) =>
    ["OPEN", "TRIAGED", "ASSIGNED", "ESCALATED", "IN_PROGRESS"].includes(i.status)
  );
  const resolvedIssues = issues.filter((i) =>
    ["RESOLVED", "VERIFIED", "CLOSED"].includes(i.status)
  );

  const assignedSlots = turnovers.filter((t) => t.vendorId).length;
  const totalCapacity = vendors.reduce((sum, v) => sum + (v.capacity || 0), 0);
  const activeAssigned = turnovers.filter(
    (t) =>
      t.vendorId &&
      ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "NEEDS_REWORK", "BLOCKED", "OVERDUE"].includes(
        t.status
      )
  ).length;
  const utilization = totalCapacity
    ? Math.min(100, pct(activeAssigned, totalCapacity))
    : pct(assignedSlots, Math.max(turnovers.length, 1));

  const byPropertyMap = new Map<
    string,
    {
      id: string;
      name: string;
      unitCode: string;
      turnovers: number;
      completed: number;
      onTime: number;
      issues: number;
    }
  >();
  for (const t of turnovers) {
    const key = t.propertyId;
    const mutable = byPropertyMap.get(key) ?? {
      id: t.property.id,
      name: t.property.name,
      unitCode: t.property.unitCode,
      turnovers: 0,
      completed: 0,
      onTime: 0,
      issues: 0,
    };
    mutable.turnovers += 1;
    if (t.status === "COMPLETED") {
      mutable.completed += 1;
      if (isOnTime(t)) mutable.onTime += 1;
    }
    mutable.issues += t.issues.length;
    byPropertyMap.set(key, mutable);
  }

  const byProperty = Array.from(byPropertyMap.values())
    .map((p) => ({
      ...p,
      onTimeRate: pct(p.onTime, p.completed),
      issueRate: pct(p.issues, p.turnovers),
    }))
    .sort((a, b) => b.turnovers - a.turnovers);

  const volumeTrend = buildDailyTrend(
    from,
    to,
    turnovers.map((t) => ({
      at: t.windowStart,
      value: 1,
      secondary: t.status === "COMPLETED" ? 1 : 0,
    }))
  );

  return {
    range: { from, to },
    summary: {
      turnoverVolume: turnovers.length,
      completedCount: completed.length,
      onTimeRate: pct(onTime.length, completed.length),
      onTimeCount: onTime.length,
      qaPassRate: pct(approved.length, decided.length),
      qaDecidedCount: decided.length,
      qaApprovedCount: approved.length,
      issueCount: issues.length,
      openIssueCount: openIssues.length,
      resolvedIssueCount: resolvedIssues.length,
      cleanerUtilization: utilization,
      assignedSlots,
      cleanerCount: vendors.length,
    },
    volumeTrend,
    byProperty,
    statusBreakdown: Object.entries(
      turnovers.reduce<Record<string, number>>((acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      }, {})
    )
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function getPropertyReport(
  companyId: string,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const { from, to, turnovers, inspections, issues, inventory } = await loadReportSource(
    companyId,
    filters,
    scope
  );

  const propertyMap = new Map<
    string,
    {
      id: string;
      name: string;
      unitCode: string;
      city: string;
      turnovers: number;
      completed: number;
      onTime: number;
      overdueish: number;
      issues: number;
      openIssues: number;
      qaFails: number;
      qaTotal: number;
      restockSignals: number;
      failureTitles: Record<string, number>;
    }
  >();

  for (const t of turnovers) {
    const row =
      propertyMap.get(t.propertyId) ??
      {
        id: t.property.id,
        name: t.property.name,
        unitCode: t.property.unitCode,
        city: t.property.city,
        turnovers: 0,
        completed: 0,
        onTime: 0,
        overdueish: 0,
        issues: 0,
        openIssues: 0,
        qaFails: 0,
        qaTotal: 0,
        restockSignals: 0,
        failureTitles: {},
      };
    row.turnovers += 1;
    if (t.status === "COMPLETED") {
      row.completed += 1;
      if (isOnTime(t)) row.onTime += 1;
    }
    if (["OVERDUE", "BLOCKED", "NEEDS_REWORK"].includes(t.status)) row.overdueish += 1;
    row.issues += t.issues.length;
    row.openIssues += t.issues.filter((i) =>
      ["OPEN", "TRIAGED", "ASSIGNED", "ESCALATED", "IN_PROGRESS"].includes(i.status)
    ).length;
    row.restockSignals += t.checklistItems.filter(
      (c) =>
        c.completed &&
        (c.section.toLowerCase().includes("restock") ||
          c.title.toLowerCase().includes("restock") ||
          c.title.toLowerCase().includes("linen") ||
          c.title.toLowerCase().includes("supply"))
    ).length;
    propertyMap.set(t.propertyId, row);
  }

  for (const insp of inspections) {
    const pid = insp.turnover.propertyId;
    const row = propertyMap.get(pid);
    if (!row) continue;
    row.qaTotal += 1;
    const failedItems = insp.items.filter((i) => i.result === "FAIL");
    const failedPhotos = insp.photos.filter((p) => p.result === "FAIL");
    if (insp.status === "REJECTED" || insp.status === "NEEDS_REWORK" || failedItems.length) {
      row.qaFails += 1;
    }
    for (const item of failedItems) {
      const key = `${item.section}: ${item.title}`;
      row.failureTitles[key] = (row.failureTitles[key] ?? 0) + 1;
    }
    for (const photo of failedPhotos) {
      const key = `Photo: ${photo.label}`;
      row.failureTitles[key] = (row.failureTitles[key] ?? 0) + 1;
    }
    propertyMap.set(pid, row);
  }

  const lowStockByProperty = inventory.reduce<Record<string, number>>((acc, item) => {
    if (!item.propertyId) return acc;
    if (item.quantity <= item.reorderLevel) {
      acc[item.propertyId] = (acc[item.propertyId] ?? 0) + 1;
    }
    return acc;
  }, {});

  const properties = Array.from(propertyMap.values())
    .map((p) => {
      const topFailures = Object.entries(p.failureTitles)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => ({ label, count }));
      return {
        id: p.id,
        name: p.name,
        unitCode: p.unitCode,
        city: p.city,
        turnovers: p.turnovers,
        completed: p.completed,
        onTimeRate: pct(p.onTime, p.completed),
        issueRate: pct(p.issues, p.turnovers),
        openIssues: p.openIssues,
        qaFailRate: pct(p.qaFails, p.qaTotal),
        restockFrequency: p.restockSignals,
        lowStockItems: lowStockByProperty[p.id] ?? 0,
        atRisk: p.overdueish,
        topFailures,
      };
    })
    .sort((a, b) => b.turnovers - a.turnovers);

  const issueTrend = buildDailyTrend(
    from,
    to,
    issues.map((i) => ({ at: i.createdAt, value: 1 }))
  );

  return {
    range: { from, to },
    properties,
    issueTrend,
    totals: {
      properties: properties.length,
      turnovers: turnovers.length,
      issues: issues.length,
      avgOnTimeRate: properties.length
        ? Math.round(
            (properties.reduce((s, p) => s + p.onTimeRate, 0) / properties.length) * 10
          ) / 10
        : 0,
    },
  };
}

export async function getQaIssueReport(
  companyId: string,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const { from, to, turnovers, inspections, issues } = await loadReportSource(
    companyId,
    filters,
    scope
  );

  const decided = inspections.filter((i) =>
    ["APPROVED", "REJECTED", "NEEDS_REWORK"].includes(i.status)
  );
  const approved = decided.filter((i) => i.status === "APPROVED");
  const needsRework = decided.filter((i) => i.status === "NEEDS_REWORK");
  const rejected = decided.filter((i) => i.status === "REJECTED");

  const failureCounts = new Map<string, number>();
  for (const insp of inspections) {
    for (const item of insp.items.filter((i) => i.result === "FAIL")) {
      const key = `${item.section} · ${item.title}`;
      failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1);
    }
    for (const photo of insp.photos.filter((p) => p.result === "FAIL")) {
      const key = `Photo · ${photo.label}`;
      failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1);
    }
  }
  const topFailureCategories = Array.from(failureCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recurringMap = new Map<string, { title: string; category: string; count: number }>();
  for (const issue of issues) {
    const key = `${issue.category}::${issue.title.toLowerCase().trim()}`;
    const row = recurringMap.get(key) ?? {
      title: issue.title,
      category: issue.category,
      count: 0,
    };
    row.count += 1;
    recurringMap.set(key, row);
  }
  const recurringIssues = Array.from(recurringMap.values())
    .filter((r) => r.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const reinspectedTurnovers = turnovers.filter((t) => t.qaInspections.length > 1);
  const resolutionHours = issues
    .filter((i) => i.resolvedAt || i.closedAt)
    .map((i) => {
      const end = (i.resolvedAt ?? i.closedAt)!;
      return (end.getTime() - i.createdAt.getTime()) / (60 * 60 * 1000);
    });

  const bySeverity = Object.entries(
    issues.reduce<Record<string, number>>((acc, i) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => b.count - a.count);

  const byCategory = Object.entries(
    issues.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const qaTrend = buildDailyTrend(
    from,
    to,
    inspections.map((i) => ({
      at: i.createdAt,
      value: 1,
      secondary: i.status === "APPROVED" ? 1 : 0,
    }))
  );

  return {
    range: { from, to },
    summary: {
      inspections: inspections.length,
      decided: decided.length,
      passRate: pct(approved.length, decided.length),
      reworkRate: pct(needsRework.length, decided.length),
      rejectRate: pct(rejected.length, decided.length),
      reinspectionRate: pct(reinspectedTurnovers.length, turnovers.length),
      reinspectedTurnovers: reinspectedTurnovers.length,
      issueCount: issues.length,
      avgResolutionHours: averageHours(resolutionHours),
      medianResolutionHours: (() => {
        if (!resolutionHours.length) return null;
        const sorted = [...resolutionHours].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2
          ? Math.round(sorted[mid] * 10) / 10
          : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
      })(),
    },
    topFailureCategories,
    recurringIssues,
    bySeverity,
    byCategory,
    qaTrend,
  };
}

export async function getCleanerReport(
  companyId: string,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  const { from, to, turnovers, vendors } = await loadReportSource(companyId, filters, scope);

  const rows = vendors.map((vendor) => {
    const assigned = turnovers.filter((t) => t.vendorId === vendor.id);
    const completed = assigned.filter((t) => t.status === "COMPLETED");
    const onTime = completed.filter((t) => isOnTime(t));
    const rework = assigned.filter(
      (t) =>
        t.status === "NEEDS_REWORK" ||
        t.qaInspections.some((q) => q.status === "NEEDS_REWORK") ||
        t.statusEvents.some((e) => e.toStatus === "NEEDS_REWORK")
    );
    const active = assigned.filter((t) =>
      ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "NEEDS_REWORK", "BLOCKED", "OVERDUE"].includes(
        t.status
      )
    );
    return {
      id: vendor.id,
      name: vendor.name,
      type: vendor.type,
      capacity: vendor.capacity,
      workload: assigned.length,
      activeWorkload: active.length,
      completed: completed.length,
      completionRate: pct(completed.length, assigned.length),
      reworkRate: pct(rework.length, assigned.length),
      slaAdherence: pct(onTime.length, completed.length),
      onTimeCount: onTime.length,
      utilization: vendor.capacity
        ? Math.min(100, pct(active.length, vendor.capacity))
        : pct(active.length, Math.max(assigned.length, 1)),
    };
  });

  const sorted = rows.sort((a, b) => b.workload - a.workload);
  const workloadTrend = buildDailyTrend(
    from,
    to,
    turnovers
      .filter((t) => t.vendorId)
      .map((t) => ({ at: t.windowStart, value: 1 }))
  );

  return {
    range: { from, to },
    cleaners: sorted,
    workloadTrend,
    summary: {
      cleaners: sorted.length,
      totalAssignments: sorted.reduce((s, c) => s + c.workload, 0),
      avgCompletionRate: sorted.length
        ? Math.round(
            (sorted.reduce((s, c) => s + c.completionRate, 0) / sorted.length) * 10
          ) / 10
        : 0,
      avgReworkRate: sorted.length
        ? Math.round((sorted.reduce((s, c) => s + c.reworkRate, 0) / sorted.length) * 10) /
          10
        : 0,
      avgSlaAdherence: sorted.length
        ? Math.round(
            (sorted.reduce((s, c) => s + c.slaAdherence, 0) / sorted.length) * 10
          ) / 10
        : 0,
    },
  };
}

export async function getReportDataset(
  companyId: string,
  view: ReportView,
  filters: ReportFilters,
  scope: AccessScope = COMPANY_WIDE_SCOPE
) {
  if (view === "property") {
    const data = await getPropertyReport(companyId, filters, scope);
    return {
      filename: `property-report-${filters.from}-${filters.to}.csv`,
      csv: toCsv(
        [
          "Property",
          "Unit",
          "City",
          "Turnovers",
          "Completed",
          "On-time %",
          "Issue rate %",
          "Open issues",
          "QA fail %",
          "Restock signals",
          "Low stock items",
        ],
        data.properties.map((p) => [
          p.name,
          p.unitCode,
          p.city,
          p.turnovers,
          p.completed,
          p.onTimeRate,
          p.issueRate,
          p.openIssues,
          p.qaFailRate,
          p.restockFrequency,
          p.lowStockItems,
        ])
      ),
    };
  }

  if (view === "qa") {
    const data = await getQaIssueReport(companyId, filters, scope);
    return {
      filename: `qa-issues-report-${filters.from}-${filters.to}.csv`,
      csv: toCsv(
        ["Section", "Metric", "Value"],
        [
          ["Summary", "Inspections", data.summary.inspections],
          ["Summary", "Pass rate %", data.summary.passRate],
          ["Summary", "Rework rate %", data.summary.reworkRate],
          ["Summary", "Reinspection rate %", data.summary.reinspectionRate],
          ["Summary", "Issues", data.summary.issueCount],
          ["Summary", "Avg resolution hours", data.summary.avgResolutionHours ?? ""],
          ...data.topFailureCategories.map((f) => ["Top failure", f.label, f.count]),
          ...data.recurringIssues.map((r) => [
            "Recurring issue",
            `${r.category}: ${r.title}`,
            r.count,
          ]),
          ...data.byCategory.map((c) => ["Issue category", c.category, c.count]),
        ]
      ),
    };
  }

  if (view === "cleaners") {
    const data = await getCleanerReport(companyId, filters, scope);
    return {
      filename: `cleaner-report-${filters.from}-${filters.to}.csv`,
      csv: toCsv(
        [
          "Cleaner",
          "Type",
          "Capacity",
          "Workload",
          "Active",
          "Completed",
          "Completion %",
          "Rework %",
          "SLA adherence %",
          "Utilization %",
        ],
        data.cleaners.map((c) => [
          c.name,
          c.type,
          c.capacity,
          c.workload,
          c.activeWorkload,
          c.completed,
          c.completionRate,
          c.reworkRate,
          c.slaAdherence,
          c.utilization,
        ])
      ),
    };
  }

  const data = await getReportingDashboard(companyId, filters, scope);
  return {
    filename: `operations-overview-${filters.from}-${filters.to}.csv`,
    csv: toCsv(
      ["Property", "Unit", "Turnovers", "Completed", "On-time %", "Issue rate %"],
      data.byProperty.map((p) => [
        p.name,
        p.unitCode,
        p.turnovers,
        p.completed,
        p.onTimeRate,
        p.issueRate,
      ])
    ),
  };
}

export type ReportingDashboard = Awaited<ReturnType<typeof getReportingDashboard>>;
export type PropertyReport = Awaited<ReturnType<typeof getPropertyReport>>;
export type QaIssueReport = Awaited<ReturnType<typeof getQaIssueReport>>;
export type CleanerReport = Awaited<ReturnType<typeof getCleanerReport>>;
