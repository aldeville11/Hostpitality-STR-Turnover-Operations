import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";
import { recordAssignmentChange, recordStatusChange } from "./turnovers";
import { endOfDay, startOfDay } from "./utils";

export const VENDOR_TYPES = ["CLEANER", "VENDOR", "COORDINATOR"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const AVAILABILITY_STATUSES = [
  "AVAILABLE",
  "UNAVAILABLE",
  "OUT_OF_SERVICE",
] as const;
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Available",
  UNAVAILABLE: "Unavailable",
  OUT_OF_SERVICE: "Out of service",
};

export const TYPE_LABELS: Record<string, string> = {
  CLEANER: "Cleaner",
  VENDOR: "Vendor / Handyman",
  COORDINATOR: "Coordinator",
};

const OPEN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ASSIGNED",
  "IN_PROGRESS",
  "READY_FOR_QA",
  "BLOCKED",
  "OVERDUE",
];

export type AssignmentConflict = {
  code:
    | "unavailable"
    | "out_of_service"
    | "inactive"
    | "overlap"
    | "over_capacity"
    | "coverage"
    | "skill"
    | "sla_risk";
  severity: "block" | "warn";
  message: string;
};

export function parseCoverageAreas(raw: string | null | undefined): string[] {
  const parsed = parseJson<string[]>(raw, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

export function parseSkills(raw: string | null | undefined): string[] {
  const parsed = parseJson<string[]>(raw, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

export function isEffectivelyAvailable(vendor: {
  active: boolean;
  availabilityStatus: string;
  unavailableUntil: Date | null;
}) {
  if (!vendor.active) return false;
  if (vendor.availabilityStatus === "OUT_OF_SERVICE") return false;
  if (vendor.availabilityStatus === "UNAVAILABLE") {
    if (vendor.unavailableUntil && vendor.unavailableUntil.getTime() < Date.now()) {
      return true;
    }
    return false;
  }
  return true;
}

function windowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export async function evaluateAssignmentConflicts(input: {
  companyId: string;
  vendorId: string;
  turnoverId: string;
}) {
  const [vendor, turnover] = await Promise.all([
    prisma.vendor.findFirst({
      where: { id: input.vendorId, companyId: input.companyId },
      include: {
        assignments: {
          where: {
            status: { in: OPEN_STATUSES },
            id: { not: input.turnoverId },
          },
          include: { property: true },
        },
      },
    }),
    prisma.turnover.findFirst({
      where: { id: input.turnoverId, companyId: input.companyId },
      include: { property: true, sow: true },
    }),
  ]);

  const conflicts: AssignmentConflict[] = [];
  if (!vendor) {
    return {
      conflicts: [
        {
          code: "inactive" as const,
          severity: "block" as const,
          message: "Cleaner not found",
        },
      ],
      vendor: null,
      turnover: null,
    };
  }
  if (!turnover) {
    return {
      conflicts: [
        {
          code: "inactive" as const,
          severity: "block" as const,
          message: "Turnover not found",
        },
      ],
      vendor,
      turnover: null,
    };
  }

  if (!vendor.active) {
    conflicts.push({
      code: "inactive",
      severity: "block",
      message: `${vendor.name} is inactive on the roster`,
    });
  }

  if (vendor.availabilityStatus === "OUT_OF_SERVICE") {
    conflicts.push({
      code: "out_of_service",
      severity: "block",
      message: `${vendor.name} is marked out of service${
        vendor.unavailableReason ? `: ${vendor.unavailableReason}` : ""
      }`,
    });
  } else if (
    vendor.availabilityStatus === "UNAVAILABLE" &&
    (!vendor.unavailableUntil || vendor.unavailableUntil.getTime() > Date.now())
  ) {
    conflicts.push({
      code: "unavailable",
      severity: "block",
      message: `${vendor.name} is unavailable${
        vendor.unavailableUntil
          ? ` until ${vendor.unavailableUntil.toLocaleString()}`
          : ""
      }${vendor.unavailableReason ? ` (${vendor.unavailableReason})` : ""}`,
    });
  }

  const coverage = parseCoverageAreas(vendor.coverageAreasJson);
  if (coverage.length > 0) {
    const city = turnover.property.city;
    const areaMatch = coverage.some(
      (c) => c.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(c.toLowerCase())
    );
    if (!areaMatch) {
      conflicts.push({
        code: "coverage",
        severity: "warn",
        message: `${turnover.property.city} is outside ${vendor.name}'s coverage (${coverage.join(", ")})`,
      });
    }
  }

  const skills = parseSkills(vendor.skillsJson);
  if (skills.length > 0) {
    const unitType = turnover.property.unitType;
    const skillMatch = skills.some(
      (s) => s.toLowerCase() === unitType.toLowerCase() || s.toLowerCase() === "all"
    );
    if (!skillMatch) {
      conflicts.push({
        code: "skill",
        severity: "warn",
        message: `Skill mismatch: property is ${unitType}; cleaner skills are ${skills.join(", ")}`,
      });
    }
  }

  const openLoad = vendor.assignments.length;
  if (openLoad >= vendor.capacity) {
    conflicts.push({
      code: "over_capacity",
      severity: "warn",
      message: `${vendor.name} is at capacity (${openLoad}/${vendor.capacity} open jobs)`,
    });
  }

  const overlaps = vendor.assignments.filter((job) =>
    windowsOverlap(turnover.windowStart, turnover.windowEnd, job.windowStart, job.windowEnd)
  );
  for (const job of overlaps) {
    conflicts.push({
      code: "overlap",
      severity: "warn",
      message: `Overlaps ${job.property.name} (${job.windowStart.toLocaleString()} – ${job.windowEnd.toLocaleString()})`,
    });
  }

  // SLA risk: many jobs due before this deadline
  const dueBefore = vendor.assignments.filter(
    (job) => job.deadlineAt.getTime() <= turnover.deadlineAt.getTime()
  );
  if (dueBefore.length >= Math.max(2, vendor.capacity - 1)) {
    conflicts.push({
      code: "sla_risk",
      severity: "warn",
      message: `${dueBefore.length} other jobs due at or before this deadline — SLA risk`,
    });
  }

  return { conflicts, vendor, turnover };
}

export async function listCleaners(
  companyId: string,
  filters?: { type?: string; availability?: string; q?: string }
) {
  const vendors = await prisma.vendor.findMany({
    where: {
      companyId,
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.availability ? { availabilityStatus: filters.availability } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q } },
              { email: { contains: filters.q } },
              { phone: { contains: filters.q } },
            ],
          }
        : {}),
    },
    include: {
      assignments: {
        where: { status: { in: OPEN_STATUSES } },
        include: { property: true },
        orderBy: { windowStart: "asc" },
      },
      defaultProperties: {
        where: { active: true },
        select: { id: true, name: true, unitCode: true, city: true },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: [{ availabilityStatus: "asc" }, { name: "asc" }],
  });

  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  return vendors.map((vendor) => {
    const coverageAreas = parseCoverageAreas(vendor.coverageAreasJson);
    const skills = parseSkills(vendor.skillsJson);
    const openJobs = vendor.assignments;
    const todayJobs = openJobs.filter(
      (j) => j.windowStart >= todayStart && j.windowStart <= todayEnd
    );
    const available = isEffectivelyAvailable(vendor);

    return {
      ...vendor,
      coverageAreas,
      skills,
      openLoad: openJobs.length,
      todayLoad: todayJobs.length,
      loadPct: Math.min(100, Math.round((openJobs.length / Math.max(1, vendor.capacity)) * 100)),
      available,
      upcoming: openJobs.slice(0, 5).map((j) => ({
        id: j.id,
        propertyName: j.property.name,
        unitCode: j.property.unitCode,
        city: j.property.city,
        status: j.status,
        priority: j.priority,
        windowStart: j.windowStart,
        windowEnd: j.windowEnd,
        deadlineAt: j.deadlineAt,
      })),
    };
  });
}

export async function getCleanerDetail(companyId: string, cleanerId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: cleanerId, companyId },
    include: {
      assignments: {
        where: { status: { in: OPEN_STATUSES } },
        include: {
          property: true,
          sop: true,
          sow: true,
          booking: true,
        },
        orderBy: { windowStart: "asc" },
      },
      defaultProperties: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          unitCode: true,
          city: true,
          unitType: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!vendor) return null;

  const horizon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const unassigned = await prisma.turnover.findMany({
    where: {
      companyId,
      vendorId: null,
      status: { in: ["DRAFT", "SCHEDULED", "BLOCKED", "OVERDUE"] },
      windowStart: { lte: horizon },
    },
    include: { property: true, sow: true },
    orderBy: { windowStart: "asc" },
    take: 20,
  });

  const assignmentHistory = await prisma.turnoverAssignmentEvent.findMany({
    where: {
      OR: [{ toVendorId: vendor.id }, { fromVendorId: vendor.id }],
    },
    include: {
      turnover: {
        include: { property: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  // Workload by date for next 7 days
  const days: Array<{
    date: string;
    label: string;
    jobs: Array<{
      id: string;
      propertyName: string;
      unitCode: string;
      status: string;
      windowStart: Date;
      windowEnd: Date;
      deadlineAt: Date;
      priority: string;
    }>;
  }> = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() + i);
    const dayEnd = endOfDay(day);
    const jobs = vendor.assignments
      .filter((j) => j.windowStart >= day && j.windowStart <= dayEnd)
      .map((j) => ({
        id: j.id,
        propertyName: j.property.name,
        unitCode: j.property.unitCode,
        status: j.status,
        windowStart: j.windowStart,
        windowEnd: j.windowEnd,
        deadlineAt: j.deadlineAt,
        priority: j.priority,
      }));
    days.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      jobs,
    });
  }

  // Detect internal overlaps for this cleaner
  const conflicts: AssignmentConflict[] = [];
  const jobs = vendor.assignments;
  for (let i = 0; i < jobs.length; i++) {
    for (let j = i + 1; j < jobs.length; j++) {
      if (
        windowsOverlap(
          jobs[i].windowStart,
          jobs[i].windowEnd,
          jobs[j].windowStart,
          jobs[j].windowEnd
        )
      ) {
        conflicts.push({
          code: "overlap",
          severity: "warn",
          message: `${jobs[i].property.name} overlaps ${jobs[j].property.name}`,
        });
      }
    }
  }
  if (jobs.length > vendor.capacity) {
    conflicts.push({
      code: "over_capacity",
      severity: "warn",
      message: `Over capacity: ${jobs.length}/${vendor.capacity} open jobs`,
    });
  }
  if (!isEffectivelyAvailable(vendor) && jobs.length > 0) {
    conflicts.push({
      code: "unavailable",
      severity: "block",
      message: "Cleaner is unavailable but still has open assignments",
    });
  }

  // Gaps: unassigned turnovers in coverage
  const coverage = parseCoverageAreas(vendor.coverageAreasJson);
  const gaps = unassigned.filter((t) => {
    if (!coverage.length) return true;
    return coverage.some(
      (c) =>
        c.toLowerCase() === t.property.city.toLowerCase() ||
        t.property.city.toLowerCase().includes(c.toLowerCase())
    );
  });

  return {
    vendor: {
      ...vendor,
      coverageAreas: parseCoverageAreas(vendor.coverageAreasJson),
      skills: parseSkills(vendor.skillsJson),
      available: isEffectivelyAvailable(vendor),
      openLoad: vendor.assignments.length,
    },
    workloadDays: days,
    conflicts,
    gaps: gaps.map((t) => ({
      id: t.id,
      propertyName: t.property.name,
      unitCode: t.property.unitCode,
      city: t.property.city,
      status: t.status,
      priority: t.priority,
      windowStart: t.windowStart,
      deadlineAt: t.deadlineAt,
      slaMinutes: t.sow?.slaMinutes ?? null,
    })),
    unassigned,
    assignmentHistory,
  };
}

export async function assignCleanerToTurnover(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  turnoverId: string;
  vendorId: string | null;
  note?: string;
  reason?: string;
  manualOverride?: boolean;
}) {
  const turnover = await prisma.turnover.findFirst({
    where: { id: input.turnoverId, companyId: input.companyId },
    include: { vendor: true, property: true },
  });
  if (!turnover) throw new Error("Turnover not found");

  let nextVendor = null as Awaited<ReturnType<typeof prisma.vendor.findFirst>>;
  let conflicts: AssignmentConflict[] = [];

  if (input.vendorId) {
    const evalResult = await evaluateAssignmentConflicts({
      companyId: input.companyId,
      vendorId: input.vendorId,
      turnoverId: input.turnoverId,
    });
    conflicts = evalResult.conflicts;
    nextVendor = evalResult.vendor;

    const blockers = conflicts.filter((c) => c.severity === "block");
    const warnings = conflicts.filter((c) => c.severity === "warn");
    if (blockers.length && !input.manualOverride) {
      return {
        ok: false as const,
        error: blockers[0].message,
        conflicts,
        requiresOverride: true,
      };
    }
    if (warnings.length && !input.manualOverride) {
      return {
        ok: false as const,
        error: warnings[0].message,
        conflicts,
        requiresOverride: true,
      };
    }
  }

  const nextStatus =
    input.vendorId && ["DRAFT", "SCHEDULED", "BLOCKED"].includes(turnover.status)
      ? "ASSIGNED"
      : !input.vendorId && turnover.status === "ASSIGNED"
        ? "SCHEDULED"
        : turnover.status;

  const noteParts = [
    input.reason?.trim(),
    input.note?.trim(),
    input.manualOverride && conflicts.length
      ? `Manual override: ${conflicts.map((c) => c.code).join(", ")}`
      : null,
  ].filter(Boolean);

  await prisma.turnover.update({
    where: { id: turnover.id },
    data: {
      vendorId: input.vendorId,
      status: nextStatus,
    },
  });

  await recordAssignmentChange({
    turnoverId: turnover.id,
    fromVendorId: turnover.vendorId,
    toVendorId: input.vendorId,
    fromName: turnover.vendor?.name,
    toName: nextVendor?.name ?? null,
    note: noteParts.join(" · ") || (input.vendorId ? "Cleaner assigned" : "Cleaner unassigned"),
    actorId: input.userId,
    actorName: input.actorName,
  });

  if (nextStatus !== turnover.status) {
    await recordStatusChange({
      turnoverId: turnover.id,
      fromStatus: turnover.status,
      toStatus: nextStatus,
      note: "Status updated with assignment change",
      actorId: input.userId,
      actorName: input.actorName,
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: input.vendorId ? "cleaner.assigned" : "cleaner.unassigned",
    entityType: "Turnover",
    entityId: turnover.id,
    metadata: {
      fromVendorId: turnover.vendorId,
      toVendorId: input.vendorId,
      status: nextStatus,
      manualOverride: Boolean(input.manualOverride),
      conflicts,
      reason: input.reason,
    },
  });

  return { ok: true as const, conflicts, status: nextStatus };
}

export async function updateCleanerAvailability(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  vendorId: string;
  availabilityStatus: AvailabilityStatus;
  unavailableUntil?: Date | null;
  unavailableReason?: string | null;
  notes?: string | null;
}) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: input.vendorId, companyId: input.companyId },
  });
  if (!vendor) throw new Error("Cleaner not found");

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      availabilityStatus: input.availabilityStatus,
      unavailableUntil:
        input.availabilityStatus === "AVAILABLE" ? null : input.unavailableUntil ?? null,
      unavailableReason:
        input.availabilityStatus === "AVAILABLE"
          ? null
          : input.unavailableReason?.trim() || null,
      notes: input.notes !== undefined ? input.notes : vendor.notes,
      active: input.availabilityStatus === "OUT_OF_SERVICE" ? vendor.active : vendor.active,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "cleaner.availability_updated",
    entityType: "Vendor",
    entityId: vendor.id,
    metadata: {
      from: vendor.availabilityStatus,
      to: input.availabilityStatus,
      reason: input.unavailableReason,
      until: input.unavailableUntil,
    },
  });

  return updated;
}

export async function updateCleanerProfile(input: {
  companyId: string;
  userId: string;
  vendorId: string;
  coverageAreas: string[];
  skills: string[];
  capacity: number;
  rating: number;
  phone?: string | null;
  notes?: string | null;
}) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: input.vendorId, companyId: input.companyId },
  });
  if (!vendor) throw new Error("Cleaner not found");

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      coverageAreasJson: JSON.stringify(input.coverageAreas),
      skillsJson: JSON.stringify(input.skills),
      capacity: Math.max(1, input.capacity),
      rating: Math.min(5, Math.max(0, input.rating)),
      phone: input.phone ?? vendor.phone,
      notes: input.notes ?? vendor.notes,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "cleaner.profile_updated",
    entityType: "Vendor",
    entityId: vendor.id,
    metadata: {
      coverageAreas: input.coverageAreas,
      skills: input.skills,
      capacity: input.capacity,
      rating: input.rating,
    },
  });

  return updated;
}

export async function getDispatchBoard(companyId: string) {
  const cleaners = await listCleaners(companyId);
  const unassigned = await prisma.turnover.findMany({
    where: {
      companyId,
      vendorId: null,
      status: { in: ["DRAFT", "SCHEDULED", "BLOCKED", "OVERDUE"] },
      windowStart: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    },
    include: { property: true },
    orderBy: [{ priority: "asc" }, { windowStart: "asc" }],
    take: 30,
  });

  return {
    cleaners,
    unassigned,
    gaps: unassigned.length,
    unavailableCount: cleaners.filter((c) => !c.available).length,
    overCapacity: cleaners.filter((c) => c.openLoad >= c.capacity),
  };
}
