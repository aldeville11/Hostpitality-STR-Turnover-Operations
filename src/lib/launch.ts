import { prisma } from "./db";
import { parseJson } from "./json";
import { isRole } from "./rbac";
import { ISSUE_STATUSES, canTransitionIssue } from "./issues";
import { TURNOVER_STATUSES, canTransition } from "./turnovers";
import { getJobObservability, MAX_JOB_ATTEMPTS, processDueJobs, retryFailedJobs } from "./jobs";
import {
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_WORKING_HOURS,
  parseNotificationPrefs,
  parseSystemSettings,
  parseWorkingHours,
} from "./settings";
import { ensureIntegrations } from "./integrations";
import {
  bookingSchema,
  issueSchema,
  turnoverSchema,
  userSchema,
  validateWithSchema,
} from "./validation";
import { captureError, log } from "./logger";
import { writeAuditLog } from "./audit";

export type CheckSeverity = "ok" | "warn" | "fail";

export type LaunchCheck = {
  id: string;
  area: "integrity" | "validation" | "observability" | "performance" | "readiness";
  title: string;
  severity: CheckSeverity;
  detail: string;
  count?: number;
  repairable?: boolean;
};

export type SmokeTestResult = {
  id: string;
  name: string;
  ok: boolean;
  detail: string;
  ms: number;
};

function check(
  partial: Omit<LaunchCheck, "severity"> & { severity?: CheckSeverity; pass?: boolean }
): LaunchCheck {
  if (partial.severity) return partial as LaunchCheck;
  return {
    ...partial,
    severity: partial.pass === false ? "fail" : partial.pass === true ? "ok" : "warn",
  };
}

export async function runDataIntegrityScan(companyId: string): Promise<LaunchCheck[]> {
  const checks: LaunchCheck[] = [];

  const [
    turnovers,
    bookings,
    issues,
    inspections,
    properties,
    users,
    files,
    integrations,
  ] = await Promise.all([
    prisma.turnover.findMany({
      where: { companyId },
      select: {
        id: true,
        status: true,
        propertyId: true,
        bookingId: true,
        sopId: true,
        sowId: true,
        vendorId: true,
        windowStart: true,
        windowEnd: true,
        deadlineAt: true,
        property: { select: { sopId: true, sowId: true } },
      },
      take: 500,
    }),
    prisma.booking.findMany({
      where: { property: { companyId } },
      select: {
        id: true,
        propertyId: true,
        externalId: true,
        checkIn: true,
        checkOut: true,
        status: true,
        source: true,
        guestName: true,
      },
      take: 500,
    }),
    prisma.issue.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        description: true,
        severity: true,
        status: true,
        category: true,
        companyId: true,
        turnoverId: true,
        propertyId: true,
      },
      take: 500,
    }),
    prisma.qaInspection.findMany({
      where: { companyId },
      select: { id: true, turnoverId: true, status: true },
      take: 500,
    }),
    prisma.property.findMany({
      where: { companyId },
      select: { id: true, unitCode: true, name: true, active: true },
    }),
    prisma.user.findMany({
      where: { companyId },
      select: { id: true, email: true, name: true, role: true, active: true },
    }),
    prisma.storedFile.findMany({
      where: { companyId },
      select: { id: true, entityType: true, entityId: true },
      take: 300,
    }),
    prisma.integration.findMany({
      where: { companyId },
      select: { id: true, provider: true, status: true, enabled: true, lastError: true },
    }),
  ]);

  const propertyIds = new Set(properties.map((p) => p.id));
  const turnoverIds = new Set(turnovers.map((t) => t.id));

  const invalidWindows = turnovers.filter(
    (t) => t.windowEnd.getTime() < t.windowStart.getTime()
  );
  checks.push(
    check({
      id: "turnover-windows",
      area: "integrity",
      title: "Turnover window ordering",
      pass: invalidWindows.length === 0,
      count: invalidWindows.length,
      detail:
        invalidWindows.length === 0
          ? "All turnover windows are ordered correctly."
          : `${invalidWindows.length} turnover(s) have windowEnd before windowStart.`,
      repairable: false,
    })
  );

  const unknownTurnoverStatus = turnovers.filter(
    (t) => !(TURNOVER_STATUSES as readonly string[]).includes(t.status)
  );
  checks.push(
    check({
      id: "turnover-status",
      area: "validation",
      title: "Turnover status vocabulary",
      pass: unknownTurnoverStatus.length === 0,
      count: unknownTurnoverStatus.length,
      detail:
        unknownTurnoverStatus.length === 0
          ? "All turnover statuses are recognized."
          : `${unknownTurnoverStatus.length} turnover(s) use unknown status values.`,
      repairable: true,
    })
  );

  const unknownIssueStatus = issues.filter(
    (i) => !(ISSUE_STATUSES as readonly string[]).includes(i.status)
  );
  checks.push(
    check({
      id: "issue-status",
      area: "validation",
      title: "Issue status vocabulary",
      pass: unknownIssueStatus.length === 0,
      count: unknownIssueStatus.length,
      detail:
        unknownIssueStatus.length === 0
          ? "All issue statuses are recognized."
          : `${unknownIssueStatus.length} issue(s) use unknown status values.`,
      repairable: true,
    })
  );

  const orphanIssues = issues.filter(
    (i) =>
      (i.turnoverId && !turnoverIds.has(i.turnoverId)) ||
      (i.propertyId && !propertyIds.has(i.propertyId))
  );
  checks.push(
    check({
      id: "issue-links",
      area: "integrity",
      title: "Issue relationship integrity",
      pass: orphanIssues.length === 0,
      count: orphanIssues.length,
      detail:
        orphanIssues.length === 0
          ? "Issue property/turnover links resolve."
          : `${orphanIssues.length} issue(s) reference missing property or turnover.`,
      repairable: true,
    })
  );

  const orphanQa = inspections.filter((i) => !turnoverIds.has(i.turnoverId));
  checks.push(
    check({
      id: "qa-links",
      area: "integrity",
      title: "QA inspection links",
      pass: orphanQa.length === 0,
      count: orphanQa.length,
      detail:
        orphanQa.length === 0
          ? "All QA inspections link to turnovers."
          : `${orphanQa.length} QA inspection(s) reference missing turnovers.`,
      repairable: false,
    })
  );

  const invalidBookings = bookings.filter((b) => {
    const result = validateWithSchema(bookingSchema, b);
    return !result.ok;
  });
  checks.push(
    check({
      id: "booking-schema",
      area: "validation",
      title: "Booking schema validation",
      pass: invalidBookings.length === 0,
      count: invalidBookings.length,
      detail:
        invalidBookings.length === 0
          ? "Bookings pass schema checks."
          : `${invalidBookings.length} booking(s) fail schema validation.`,
      repairable: false,
    })
  );

  const invalidTurnovers = turnovers.filter((t) => {
    const result = validateWithSchema(turnoverSchema, {
      companyId,
      propertyId: t.propertyId,
      status: t.status,
      priority: "NORMAL",
      windowStart: t.windowStart,
      windowEnd: t.windowEnd,
      deadlineAt: t.deadlineAt,
    });
    return !result.ok;
  });
  checks.push(
    check({
      id: "turnover-schema",
      area: "validation",
      title: "Turnover schema validation",
      pass: invalidTurnovers.length === 0,
      count: invalidTurnovers.length,
      detail:
        invalidTurnovers.length === 0
          ? "Turnovers pass schema checks."
          : `${invalidTurnovers.length} turnover(s) fail schema validation.`,
      repairable: false,
    })
  );

  const invalidIssues = issues.filter((i) => !validateWithSchema(issueSchema, i).ok);
  checks.push(
    check({
      id: "issue-schema",
      area: "validation",
      title: "Issue schema validation",
      pass: invalidIssues.length === 0,
      count: invalidIssues.length,
      detail:
        invalidIssues.length === 0
          ? "Issues pass schema checks."
          : `${invalidIssues.length} issue(s) fail schema validation.`,
      repairable: false,
    })
  );

  const invalidUsers = users.filter((u) => {
    if (!isRole(u.role)) return true;
    return !validateWithSchema(userSchema, u).ok;
  });
  checks.push(
    check({
      id: "user-roles",
      area: "validation",
      title: "User roles & profiles",
      pass: invalidUsers.length === 0,
      count: invalidUsers.length,
      detail:
        invalidUsers.length === 0
          ? "Users have valid roles and profiles."
          : `${invalidUsers.length} user(s) have invalid role or profile data.`,
      repairable: false,
    })
  );

  // Duplicate booking external IDs within a property (should be prevented by unique index)
  const dupMap = new Map<string, number>();
  for (const b of bookings) {
    if (!b.externalId) continue;
    const key = `${b.propertyId}::${b.externalId}`;
    dupMap.set(key, (dupMap.get(key) ?? 0) + 1);
  }
  const dups = Array.from(dupMap.values()).filter((n) => n > 1).length;
  checks.push(
    check({
      id: "booking-dupes",
      area: "integrity",
      title: "Duplicate booking external IDs",
      pass: dups === 0,
      count: dups,
      detail:
        dups === 0
          ? "No duplicate booking external IDs detected."
          : `${dups} duplicate external ID group(s) found.`,
      repairable: false,
    })
  );

  const missingTemplates = turnovers.filter(
    (t) => (t.property.sopId && !t.sopId) || (t.property.sowId && !t.sowId)
  );
  checks.push(
    check({
      id: "turnover-templates",
      area: "integrity",
      title: "Turnover SOP/SOW inheritance",
      severity: missingTemplates.length ? "warn" : "ok",
      count: missingTemplates.length,
      detail:
        missingTemplates.length === 0
          ? "Turnovers inherit property SOP/SOW links when available."
          : `${missingTemplates.length} turnover(s) missing property SOP/SOW links.`,
      repairable: true,
    })
  );

  const brokenFiles = [];
  for (const file of files) {
    if (file.entityType === "Issue") {
      if (!issues.some((i) => i.id === file.entityId)) brokenFiles.push(file);
    } else if (file.entityType === "Turnover") {
      if (!turnoverIds.has(file.entityId)) brokenFiles.push(file);
    } else if (file.entityType === "QaInspection") {
      if (!inspections.some((i) => i.id === file.entityId)) brokenFiles.push(file);
    }
  }
  checks.push(
    check({
      id: "file-links",
      area: "integrity",
      title: "Stored file entity links",
      severity: brokenFiles.length ? "warn" : "ok",
      count: brokenFiles.length,
      detail:
        brokenFiles.length === 0
          ? "Stored files point at existing records."
          : `${brokenFiles.length} file(s) reference missing entities.`,
      repairable: true,
    })
  );

  const erroredIntegrations = integrations.filter((i) => i.status === "ERROR");
  checks.push(
    check({
      id: "integration-errors",
      area: "observability",
      title: "Integration sync health",
      severity: erroredIntegrations.length ? "warn" : "ok",
      count: erroredIntegrations.length,
      detail:
        erroredIntegrations.length === 0
          ? "No integrations currently in ERROR."
          : `${erroredIntegrations.length} integration(s) need reconnect: ${erroredIntegrations
              .map((i) => i.provider)
              .join(", ")}.`,
      repairable: false,
    })
  );

  const inactiveProps = properties.filter((p) => !p.active).length;
  checks.push(
    check({
      id: "properties-active",
      area: "readiness",
      title: "Active property inventory",
      severity: properties.some((p) => p.active) ? "ok" : "fail",
      count: properties.filter((p) => p.active).length,
      detail: `${properties.filter((p) => p.active).length} active / ${inactiveProps} inactive properties.`,
    })
  );

  return checks;
}

export async function repairDataIntegrity(input: {
  companyId: string;
  userId: string;
}) {
  const repairs: string[] = [];
  log.info("launch.repair.start", { companyId: input.companyId });

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: input.companyId },
  });

  // Backfill company settings JSON defaults
  const prefs = parseJson(company.notificationPrefsJson, null);
  const hours = parseJson(company.workingHoursJson, null);
  const system = parseJson(company.systemSettingsJson, null);
  const companyPatch: Record<string, string> = {};
  if (!prefs || typeof prefs !== "object") {
    companyPatch.notificationPrefsJson = JSON.stringify(DEFAULT_NOTIFICATION_PREFS);
    repairs.push("Backfilled notification preferences");
  }
  if (!hours || typeof hours !== "object") {
    companyPatch.workingHoursJson = JSON.stringify(DEFAULT_WORKING_HOURS);
    repairs.push("Backfilled working hours");
  }
  if (!system || typeof system !== "object") {
    companyPatch.systemSettingsJson = JSON.stringify(DEFAULT_SYSTEM_SETTINGS);
    repairs.push("Backfilled system settings");
  }
  if (!company.accentColor || !/^#[0-9A-Fa-f]{6}$/.test(company.accentColor)) {
    companyPatch.accentColor = "#0F766E";
    repairs.push("Reset invalid accent color");
  }
  if (Object.keys(companyPatch).length) {
    await prisma.company.update({ where: { id: company.id }, data: companyPatch });
  }

  // Ensure notification/working/system parsers stay warm
  parseNotificationPrefs(company.notificationPrefsJson);
  parseWorkingHours(company.workingHoursJson);
  parseSystemSettings(company.systemSettingsJson);

  // Backfill user access scopes
  const users = await prisma.user.findMany({ where: { companyId: input.companyId } });
  for (const user of users) {
    const scope = parseJson(user.accessScopeJson, null);
    if (!scope || typeof scope !== "object") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
        },
      });
      repairs.push(`Backfilled access scope for ${user.email}`);
    }
  }

  // Normalize unknown issue statuses to OPEN (safe fallback)
  const badIssues = await prisma.issue.findMany({
    where: {
      companyId: input.companyId,
      status: { notIn: [...ISSUE_STATUSES] },
    },
  });
  for (const issue of badIssues) {
    await prisma.issue.update({
      where: { id: issue.id },
      data: { status: "OPEN" },
    });
    repairs.push(`Normalized issue ${issue.id.slice(0, 8)} status → OPEN`);
  }

  // Normalize unknown turnover statuses to SCHEDULED (safe fallback, skip COMPLETED-like)
  const badTurnovers = await prisma.turnover.findMany({
    where: {
      companyId: input.companyId,
      status: { notIn: [...TURNOVER_STATUSES] },
    },
  });
  for (const turnover of badTurnovers) {
    await prisma.turnover.update({
      where: { id: turnover.id },
      data: { status: "SCHEDULED" },
    });
    repairs.push(`Normalized turnover ${turnover.id.slice(0, 8)} status → SCHEDULED`);
  }

  // Inherit missing SOP/SOW from property
  const turnovers = await prisma.turnover.findMany({
    where: { companyId: input.companyId },
    include: { property: { select: { sopId: true, sowId: true } } },
    take: 500,
  });
  for (const t of turnovers) {
    const data: { sopId?: string; sowId?: string } = {};
    if (!t.sopId && t.property.sopId) data.sopId = t.property.sopId;
    if (!t.sowId && t.property.sowId) data.sowId = t.property.sowId;
    if (Object.keys(data).length) {
      await prisma.turnover.update({ where: { id: t.id }, data });
      repairs.push(`Linked templates onto turnover ${t.id.slice(0, 8)}`);
    }
  }

  // Clear broken issue links
  const propertyIds = new Set(
    (
      await prisma.property.findMany({
        where: { companyId: input.companyId },
        select: { id: true },
      })
    ).map((p) => p.id)
  );
  const turnoverIds = new Set(turnovers.map((t) => t.id));
  const issues = await prisma.issue.findMany({ where: { companyId: input.companyId } });
  for (const issue of issues) {
    const data: { propertyId?: null; turnoverId?: null } = {};
    if (issue.propertyId && !propertyIds.has(issue.propertyId)) data.propertyId = null;
    if (issue.turnoverId && !turnoverIds.has(issue.turnoverId)) data.turnoverId = null;
    if (Object.keys(data).length) {
      await prisma.issue.update({ where: { id: issue.id }, data });
      repairs.push(`Cleared broken links on issue ${issue.id.slice(0, 8)}`);
    }
  }

  // Remove orphaned stored files
  const files = await prisma.storedFile.findMany({ where: { companyId: input.companyId } });
  const issueIds = new Set(issues.map((i) => i.id));
  const qaIds = new Set(
    (
      await prisma.qaInspection.findMany({
        where: { companyId: input.companyId },
        select: { id: true },
      })
    ).map((q) => q.id)
  );
  for (const file of files) {
    let orphan = false;
    if (file.entityType === "Issue" && !issueIds.has(file.entityId)) orphan = true;
    if (file.entityType === "Turnover" && !turnoverIds.has(file.entityId)) orphan = true;
    if (file.entityType === "QaInspection" && !qaIds.has(file.entityId)) orphan = true;
    if (orphan) {
      await prisma.storedFile.delete({ where: { id: file.id } });
      repairs.push(`Removed orphaned file ${file.filename}`);
    }
  }

  // Ensure integration catalog exists
  await ensureIntegrations(input.companyId);
  repairs.push("Ensured integration catalog rows");

  // Booking status default
  const bookings = await prisma.booking.findMany({
    where: { property: { companyId: input.companyId }, status: "" },
  });
  for (const booking of bookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
    });
    repairs.push(`Set booking ${booking.id.slice(0, 8)} status → CONFIRMED`);
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.launch.repaired",
    entityType: "Company",
    entityId: input.companyId,
    metadata: { repairs: repairs.length, sample: repairs.slice(0, 20) },
  });

  log.info("launch.repair.done", { companyId: input.companyId, repairs: repairs.length });
  return { repairs };
}

export async function runSmokeTests(companyId: string): Promise<SmokeTestResult[]> {
  const results: SmokeTestResult[] = [];

  async function run(id: string, name: string, fn: () => Promise<string>) {
    const started = Date.now();
    try {
      const detail = await fn();
      results.push({ id, name, ok: true, detail, ms: Date.now() - started });
    } catch (err) {
      const detail = captureError(err, { smoke: id, companyId });
      results.push({ id, name, ok: false, detail, ms: Date.now() - started });
    }
  }

  await run("company", "Company onboarded", async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    if (!company.onboardedAt) throw new Error("Company not onboarded");
    return `${company.name} · ${company.timezone}`;
  });

  await run("property", "Properties available", async () => {
    const count = await prisma.property.count({ where: { companyId, active: true } });
    if (count < 1) throw new Error("No active properties");
    return `${count} active properties`;
  });

  await run("templates", "SOP & SOW templates", async () => {
    const [sops, sows] = await Promise.all([
      prisma.sop.count({ where: { companyId, active: true } }),
      prisma.sow.count({ where: { companyId, active: true } }),
    ]);
    if (sops < 1 || sows < 1) throw new Error("Missing SOP or SOW templates");
    return `${sops} SOPs · ${sows} SOWs`;
  });

  await run("turnover-list", "Turnover list query", async () => {
    const rows = await prisma.turnover.findMany({
      where: { companyId },
      select: { id: true, status: true },
      take: 50,
      orderBy: { windowStart: "desc" },
    });
    return `${rows.length} turnover row(s) loaded`;
  });

  await run("transitions", "Status transition guards", async () => {
    if (canTransition("COMPLETED", "IN_PROGRESS")) {
      throw new Error("COMPLETED should not transition to IN_PROGRESS");
    }
    if (!canTransition("ASSIGNED", "IN_PROGRESS")) {
      throw new Error("ASSIGNED → IN_PROGRESS should be allowed");
    }
    if (canTransitionIssue("CLOSED", "TRIAGED")) {
      throw new Error("CLOSED → TRIAGED should be blocked");
    }
    if (!canTransitionIssue("OPEN", "TRIAGED")) {
      throw new Error("OPEN → TRIAGED should be allowed");
    }
    return "Turnover and issue transition guards OK";
  });

  await run("integrations", "Integration catalog", async () => {
    await ensureIntegrations(companyId);
    const count = await prisma.integration.count({ where: { companyId } });
    if (count < 8) throw new Error("Integration catalog incomplete");
    return `${count} integrations registered`;
  });

  await run("settings-json", "Settings JSON parseable", async () => {
    const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    parseNotificationPrefs(company.notificationPrefsJson);
    parseWorkingHours(company.workingHoursJson);
    parseSystemSettings(company.systemSettingsJson);
    return "Notification, hours, and system settings parse OK";
  });

  await run("jobs", "Background job processor", async () => {
    const before = await prisma.backgroundJob.count({
      where: { companyId, status: "FAILED" },
    });
    await processDueJobs(5);
    return `Processed due jobs · ${before} failed remaining`;
  });

  return results;
}

export async function getPerformanceSnapshot(companyId: string) {
  const started = Date.now();
  const [
    turnovers,
    issues,
    inspections,
    properties,
    users,
    jobs,
    syncEvents,
  ] = await Promise.all([
    prisma.turnover.count({ where: { companyId } }),
    prisma.issue.count({ where: { companyId } }),
    prisma.qaInspection.count({ where: { companyId } }),
    prisma.property.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId } }),
    getJobObservability(companyId),
    prisma.integrationSyncEvent.count({
      where: {
        integration: { companyId },
        status: "FAILED",
        startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const listQueryMs = Date.now() - started;

  return {
    listQueryMs,
    volumes: { turnovers, issues, inspections, properties, users },
    jobs,
    failedSyncs7d: syncEvents,
    recommendations: [
      turnovers > 200
        ? "Consider tighter date filters on turnover list queries."
        : "Turnover volume is within comfortable list limits.",
      jobs.failed > 0
        ? "Retry failed background jobs before launch."
        : "Background job queue is healthy.",
      syncEvents > 0
        ? "Review failed integration syncs from the last 7 days."
        : "No failed syncs in the last 7 days.",
      "List endpoints use take limits; keep filters narrow in production.",
      "Prefer server components for list pages to avoid client over-fetching.",
    ],
  };
}

export async function getObservabilitySnapshot(companyId: string) {
  const [jobs, integrations, recentAudits, recentErrors] = await Promise.all([
    getJobObservability(companyId),
    prisma.integration.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        provider: true,
        status: true,
        enabled: true,
        lastSyncAt: true,
        lastError: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
      },
    }),
    prisma.integrationSyncEvent.findMany({
      where: {
        integration: { companyId },
        status: "FAILED",
      },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        summary: true,
        error: true,
        startedAt: true,
        integration: { select: { name: true, provider: true } },
      },
    }),
  ]);

  const warnings: string[] = [];
  if (jobs.failed > 0) warnings.push(`${jobs.failed} failed background job(s)`);
  if (jobs.retryable > 0) warnings.push(`${jobs.retryable} retryable job(s)`);
  const errored = integrations.filter((i) => i.status === "ERROR");
  if (errored.length) {
    warnings.push(`${errored.length} integration(s) in ERROR`);
  }
  if (recentErrors.length) {
    warnings.push(`${recentErrors.length} recent sync failure(s)`);
  }

  return {
    jobs,
    integrations,
    recentAudits,
    recentErrors,
    warnings,
    maxJobAttempts: MAX_JOB_ATTEMPTS,
  };
}

export async function buildLaunchChecklist(companyId: string) {
  const [integrity, smoke, performance, observability, company] = await Promise.all([
    runDataIntegrityScan(companyId),
    runSmokeTests(companyId),
    getPerformanceSnapshot(companyId),
    getObservabilitySnapshot(companyId),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
  ]);

  const staticItems = [
    {
      id: "env-demo",
      title: "Demo credentials documented",
      done: true,
      detail: "manager@hostpitality.app / demo1234",
    },
    {
      id: "onboarded",
      title: "Company onboarding complete",
      done: Boolean(company.onboardedAt),
      detail: company.onboardedAt
        ? `Onboarded ${company.onboardedAt.toISOString().slice(0, 10)}`
        : "Finish onboarding before launch",
    },
    {
      id: "branding",
      title: "Branding configured",
      done: Boolean(company.brandName || company.accentColor),
      detail: company.brandName ?? company.name,
    },
  ];

  const integrityFails = integrity.filter((c) => c.severity === "fail").length;
  const integrityWarns = integrity.filter((c) => c.severity === "warn").length;
  const smokeFails = smoke.filter((s) => !s.ok).length;

  const dynamicItems = [
    {
      id: "integrity",
      title: "Data integrity scan clean",
      done: integrityFails === 0,
      detail:
        integrityFails === 0
          ? integrityWarns
            ? `Pass with ${integrityWarns} warning(s)`
            : "All integrity checks passed"
          : `${integrityFails} failing check(s)`,
    },
    {
      id: "smoke",
      title: "Core smoke tests pass",
      done: smokeFails === 0,
      detail:
        smokeFails === 0
          ? `${smoke.length}/${smoke.length} passed`
          : `${smokeFails} smoke test(s) failed`,
    },
    {
      id: "jobs",
      title: "Background jobs healthy",
      done: observability.jobs.failed === 0,
      detail:
        observability.jobs.failed === 0
          ? `${observability.jobs.pending} pending · ${observability.jobs.completedRecent} completed (24h)`
          : `${observability.jobs.failed} failed job(s)`,
    },
    {
      id: "integrations",
      title: "Integrations not in ERROR",
      done: !observability.integrations.some((i) => i.status === "ERROR"),
      detail: `${observability.integrations.filter((i) => i.status === "CONNECTED").length} connected`,
    },
    {
      id: "performance",
      title: "Diagnostics query budget",
      done: performance.listQueryMs < 3000,
      detail: `Snapshot query completed in ${performance.listQueryMs}ms`,
    },
  ];

  const items = [...staticItems, ...dynamicItems];
  const ready = items.every((i) => i.done);

  return {
    ready,
    items,
    integrity,
    smoke,
    performance,
    observability,
    score: {
      done: items.filter((i) => i.done).length,
      total: items.length,
    },
  };
}

export async function retryJobsForLaunch(input: {
  companyId: string;
  userId: string;
  force?: boolean;
}) {
  const result = await retryFailedJobs({
    companyId: input.companyId,
    force: input.force,
  });
  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.launch.jobs_retried",
    entityType: "BackgroundJob",
    entityId: input.companyId,
    metadata: result,
  });
  if (result.requeued > 0) {
    await processDueJobs(result.requeued);
  }
  return result;
}

export type LaunchChecklist = Awaited<ReturnType<typeof buildLaunchChecklist>>;
export type PerformanceSnapshot = Awaited<ReturnType<typeof getPerformanceSnapshot>>;
export type ObservabilitySnapshot = Awaited<ReturnType<typeof getObservabilitySnapshot>>;
