import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import {
  parsePhotoRequirements,
  parseRestockDefaults,
} from "./properties";
import { flattenSopSteps, parseSopDocument } from "./sops";

export const TURNOVER_STATUSES = [
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
] as const;

export type TurnoverStatus = (typeof TURNOVER_STATUSES)[number];

const TRANSITIONS: Record<string, TurnoverStatus[]> = {
  DRAFT: ["SCHEDULED", "BLOCKED", "CANCELLED"],
  SCHEDULED: ["ASSIGNED", "BLOCKED", "DRAFT", "OVERDUE", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "SCHEDULED", "BLOCKED", "OVERDUE", "CANCELLED"],
  IN_PROGRESS: ["READY_FOR_QA", "BLOCKED", "ASSIGNED", "OVERDUE", "CANCELLED"],
  READY_FOR_QA: ["COMPLETED", "NEEDS_REWORK", "IN_PROGRESS", "BLOCKED", "CANCELLED"],
  NEEDS_REWORK: ["IN_PROGRESS", "READY_FOR_QA", "ASSIGNED", "BLOCKED", "CANCELLED"],
  BLOCKED: ["DRAFT", "SCHEDULED", "ASSIGNED", "IN_PROGRESS", "CANCELLED"],
  OVERDUE: ["ASSIGNED", "IN_PROGRESS", "READY_FOR_QA", "BLOCKED", "COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT", "SCHEDULED"],
};

export function canTransition(from: string, to: string) {
  return (TRANSITIONS[from] ?? []).includes(to as TurnoverStatus);
}

export function nextStatuses(from: string): TurnoverStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function buildChecklistFromSop(contentJson: string | null | undefined) {
  const doc = parseSopDocument(contentJson);
  const steps = flattenSopSteps(doc);
  if (!steps.length) {
    return [
      {
        section: "Pre-turnover prep",
        title: "Confirm checkout and gather supplies",
        instructions: "Verify guest departure and load supply caddy.",
        requiresPhoto: false,
        sortOrder: 0,
      },
      {
        section: "Room-by-room",
        title: "Complete property clean",
        instructions: "Follow property playbook room by room.",
        requiresPhoto: true,
        sortOrder: 1,
      },
      {
        section: "Completion sign-off",
        title: "Sign off for QA",
        instructions: "Confirm checklist complete and ready for QA.",
        requiresPhoto: false,
        sortOrder: 2,
      },
    ];
  }

  return steps;
}

export async function listTurnovers(
  companyId: string,
  filters?: { status?: string; propertyId?: string; q?: string }
) {
  const turnovers = await prisma.turnover.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters?.q
        ? {
            OR: [
              { property: { name: { contains: filters.q } } },
              { property: { unitCode: { contains: filters.q } } },
              { vendor: { name: { contains: filters.q } } },
            ],
          }
        : {}),
    },
    include: {
      property: true,
      vendor: true,
      booking: true,
      checklistItems: true,
      _count: { select: { checklistItems: true } },
    },
    orderBy: [{ windowStart: "desc" }, { priority: "asc" }],
  });

  const priorityRank: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
  };

  return [...turnovers].sort((a, b) => {
    const byDate = b.windowStart.getTime() - a.windowStart.getTime();
    if (byDate !== 0) return byDate;
    return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
  });
}

export async function getTurnoverDetail(companyId: string, turnoverId: string) {
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId },
    include: {
      property: {
        include: { defaultVendor: true },
      },
      booking: true,
      sop: true,
      sow: true,
      vendor: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      assignmentEvents: { orderBy: { createdAt: "desc" } },
      issues: { orderBy: [{ blocking: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!turnover) return null;

  const vendors = await prisma.vendor.findMany({
    where: { companyId, active: true },
    orderBy: { name: "asc" },
  });

  const photoRequirements = parsePhotoRequirements(turnover.property.photoRequirementsJson);
  const restockDefaults = parseRestockDefaults(turnover.property.restockDefaultsJson);

  return {
    turnover,
    vendors,
    photoRequirements,
    restockDefaults,
    allowedNextStatuses: nextStatuses(turnover.status),
    checklistProgress: {
      total: turnover.checklistItems.length,
      done: turnover.checklistItems.filter((i) => i.completed).length,
    },
  };
}

export async function recordStatusChange(input: {
  turnoverId: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string;
  actorId?: string | null;
  actorName?: string | null;
}) {
  return prisma.turnoverStatusEvent.create({
    data: {
      turnoverId: input.turnoverId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export async function recordAssignmentChange(input: {
  turnoverId: string;
  fromVendorId?: string | null;
  toVendorId?: string | null;
  fromName?: string | null;
  toName?: string | null;
  note?: string;
  actorId?: string | null;
  actorName?: string | null;
}) {
  return prisma.turnoverAssignmentEvent.create({
    data: {
      turnoverId: input.turnoverId,
      fromVendorId: input.fromVendorId ?? null,
      toVendorId: input.toVendorId ?? null,
      fromName: input.fromName ?? null,
      toName: input.toName ?? null,
      note: input.note,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export async function generateChecklistForTurnover(turnoverId: string, sopContentJson?: string | null) {
  await prisma.turnoverChecklistItem.deleteMany({ where: { turnoverId } });
  const items = buildChecklistFromSop(sopContentJson);
  await prisma.turnoverChecklistItem.createMany({
    data: items.map((item) => ({
      turnoverId,
      ...item,
    })),
  });
  return items.length;
}

/** Create a turnover from a booking (or synthetic checkout window). */
export async function createTurnoverFromBooking(input: {
  companyId: string;
  userId: string;
  propertyId: string;
  bookingId?: string;
  priority?: string;
  notes?: string;
  actorName?: string;
}) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, companyId: input.companyId },
    include: { sop: true, sow: true, defaultVendor: true },
  });
  if (!property) throw new Error("Property not found");

  let booking = input.bookingId
    ? await prisma.booking.findFirst({
        where: { id: input.bookingId, propertyId: property.id },
      })
    : null;

  if (input.bookingId && !booking) throw new Error("Booking not found");

  if (booking) {
    const existing = await prisma.turnover.findUnique({ where: { bookingId: booking.id } });
    if (existing) return { turnoverId: existing.id, created: false };
  }

  if (!booking) {
    const checkOut = new Date(Date.now() + 6 * 60 * 60 * 1000);
    booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        externalId: `gen-${Date.now()}`,
        guestName: "Calendar Guest",
        checkIn: new Date(checkOut.getTime() - 3 * 24 * 60 * 60 * 1000),
        checkOut,
        source: property.bookingSource || "calendar_sync",
      },
    });
  }

  const slaMinutes = property.sow
    ? property.sow.completionDeadlineMinutes || property.sow.slaMinutes || 240
    : 240;
  const buffer = property.turnoverBufferMins ?? 60;
  const windowStart = new Date(booking.checkOut.getTime() + buffer * 60 * 1000);
  const windowEnd = new Date(windowStart.getTime() + slaMinutes * 60 * 1000);

  const photos = parsePhotoRequirements(property.photoRequirementsJson);
  const photosRequired = photos.filter((p) => p.required).length || 4;

  const initialStatus: TurnoverStatus = property.defaultVendorId ? "ASSIGNED" : "SCHEDULED";

  const turnover = await prisma.turnover.create({
    data: {
      companyId: input.companyId,
      propertyId: property.id,
      bookingId: booking.id,
      sopId: property.sopId,
      sowId: property.sowId,
      vendorId: property.defaultVendorId,
      status: initialStatus,
      priority: input.priority ?? "NORMAL",
      windowStart,
      windowEnd,
      deadlineAt: windowEnd,
      photosRequired,
      notes: input.notes ?? "Created from booking/calendar",
    },
  });

  await recordStatusChange({
    turnoverId: turnover.id,
    fromStatus: null,
    toStatus: initialStatus,
    note: "Turnover created from booking/calendar",
    actorId: input.userId,
    actorName: input.actorName,
  });

  if (property.defaultVendorId) {
    await recordAssignmentChange({
      turnoverId: turnover.id,
      fromVendorId: null,
      toVendorId: property.defaultVendorId,
      fromName: null,
      toName: property.defaultVendor?.name ?? null,
      note: "Auto-assigned default property cleaner",
      actorId: input.userId,
      actorName: input.actorName,
    });
  }

  await generateChecklistForTurnover(turnover.id, property.sop?.contentJson);

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "turnover.created",
    entityType: "Turnover",
    entityId: turnover.id,
    metadata: { bookingId: booking.id, propertyId: property.id, status: initialStatus },
  });

  return { turnoverId: turnover.id, created: true };
}

export async function syncTurnoversFromCalendars(input: {
  companyId: string;
  userId: string;
  actorName?: string;
}) {
  const properties = await prisma.property.findMany({
    where: {
      companyId: input.companyId,
      active: true,
      OR: [
        { calendarUrl: { not: null } },
        { bookingSource: { not: "manual" } },
        { calendarStatus: { in: ["synced", "pending"] } },
      ],
    },
    include: {
      bookings: {
        where: { turnover: null },
        orderBy: { checkOut: "asc" },
        take: 3,
      },
    },
  });

  const results = [];
  for (const property of properties) {
    if (property.bookings.length === 0) {
      // Synthesize one booking/turnover so calendar-connected properties stay ready
      const created = await createTurnoverFromBooking({
        companyId: input.companyId,
        userId: input.userId,
        propertyId: property.id,
        actorName: input.actorName,
        notes: "Generated from calendar sync",
      });
      results.push({ propertyId: property.id, ...created });
    } else {
      for (const booking of property.bookings) {
        const created = await createTurnoverFromBooking({
          companyId: input.companyId,
          userId: input.userId,
          propertyId: property.id,
          bookingId: booking.id,
          actorName: input.actorName,
        });
        results.push({ propertyId: property.id, bookingId: booking.id, ...created });
      }
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { calendarSyncedAt: new Date(), calendarStatus: "synced" },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "turnover.calendar_sync",
    entityType: "Company",
    entityId: input.companyId,
    metadata: { results },
  });

  return results;
}
