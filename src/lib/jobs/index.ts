import { prisma } from "../db";
import { proposeAgentAction, runLeadTurnoverPipeline } from "../agents";
import { writeAuditLog } from "../audit";

export async function enqueueJob(input: {
  companyId?: string;
  type: string;
  payload?: Record<string, unknown>;
  runAt?: Date;
}) {
  return prisma.backgroundJob.create({
    data: {
      companyId: input.companyId,
      type: input.type,
      payloadJson: JSON.stringify(input.payload ?? {}),
      runAt: input.runAt ?? new Date(),
      status: "PENDING",
    },
  });
}

export async function processDueJobs(limit = 20) {
  const now = new Date();
  const jobs = await prisma.backgroundJob.findMany({
    where: { status: "PENDING", runAt: { lte: now } },
    orderBy: { runAt: "asc" },
    take: limit,
  });

  const results = [];
  for (const job of jobs) {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
    });
    try {
      const payload = JSON.parse(job.payloadJson || "{}") as Record<string, unknown>;
      const result = await handleJob(job.type, payload, job.companyId);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          payloadJson: JSON.stringify({ ...payload, result }),
        },
      });
      results.push({ id: job.id, ok: true, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Job failed";
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: message, completedAt: new Date() },
      });
      results.push({ id: job.id, ok: false, error: message });
    }
  }
  return results;
}

async function handleJob(
  type: string,
  payload: Record<string, unknown>,
  companyId: string | null
) {
  switch (type) {
    case "booking.sync":
      return syncBookings(companyId!, payload);
    case "turnover.remind":
      return remindTurnover(String(payload.turnoverId));
    case "turnover.overdue_check":
      return markOverdue();
    case "turnover.pipeline":
      return runLeadTurnoverPipeline(String(payload.turnoverId), companyId!);
    case "inventory.alert_scan":
      return scanInventory(companyId!);
    default:
      return { skipped: true, type };
  }
}

async function syncBookings(companyId: string, payload: Record<string, unknown>) {
  const propertyId = String(payload.propertyId);
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId },
  });
  if (!property) throw new Error("Property not found");

  const checkOut = payload.checkOut
    ? new Date(String(payload.checkOut))
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const checkIn = payload.checkIn
    ? new Date(String(payload.checkIn))
    : new Date(checkOut.getTime() - 3 * 24 * 60 * 60 * 1000);
  const nextCheckIn = payload.nextCheckIn
    ? new Date(String(payload.nextCheckIn))
    : new Date(checkOut.getTime() + 4 * 60 * 60 * 1000);

  const externalId = String(payload.externalId ?? `sync-${Date.now()}`);
  const booking = await prisma.booking.upsert({
    where: { propertyId_externalId: { propertyId, externalId } },
    create: {
      propertyId,
      externalId,
      guestName: String(payload.guestName ?? "Guest"),
      checkIn,
      checkOut,
      source: "calendar_sync",
    },
    update: { checkIn, checkOut, guestName: String(payload.guestName ?? "Guest") },
  });

  const existing = await prisma.turnover.findUnique({ where: { bookingId: booking.id } });
  if (existing) return { bookingId: booking.id, turnoverId: existing.id, created: false };

  const priorCount = await prisma.turnover.count({
    where: { propertyId, status: "COMPLETED" },
  });
  const isDeepClean =
    property.sopId
      ? (await prisma.sop.findUnique({ where: { id: property.sopId } }))?.deepCleanEveryN ===
          0
        ? false
        : (priorCount + 1) %
            ((await prisma.sop.findUnique({ where: { id: property.sopId } }))?.deepCleanEveryN ??
              4) ===
          0
      : false;

  const turnover = await prisma.turnover.create({
    data: {
      companyId,
      propertyId,
      bookingId: booking.id,
      sopId: property.sopId,
      sowTemplateId: property.sowTemplateId,
      windowStart: checkOut,
      windowEnd: nextCheckIn,
      deadlineAt: nextCheckIn,
      isDeepClean,
      status: "SCHEDULED",
    },
  });

  await prisma.property.update({
    where: { id: propertyId },
    data: { calendarSyncedAt: new Date() },
  });

  await writeAuditLog({
    companyId,
    action: "booking.sync",
    entityType: "Turnover",
    entityId: turnover.id,
    metadata: { bookingId: booking.id, propertyId },
  });

  await proposeAgentAction({
    companyId,
    turnoverId: turnover.id,
    agentType: "BOOKING_SYNC",
    title: "Confirm calendar sync turnover",
    description: `Created turnover for ${property.name} from checkout ${checkOut.toISOString()}.`,
    payload: { bookingId: booking.id, turnoverId: turnover.id },
  });

  await enqueueJob({
    companyId,
    type: "turnover.pipeline",
    payload: { turnoverId: turnover.id },
  });

  await enqueueJob({
    companyId,
    type: "turnover.remind",
    payload: { turnoverId: turnover.id },
    runAt: new Date(checkOut.getTime() - 2 * 60 * 60 * 1000),
  });

  return { bookingId: booking.id, turnoverId: turnover.id, created: true };
}

async function remindTurnover(turnoverId: string) {
  const turnover = await prisma.turnover.findUnique({
    where: { id: turnoverId },
    include: { property: true, assignments: true },
  });
  if (!turnover || turnover.status === "COMPLETED" || turnover.status === "CANCELLED") {
    return { skipped: true };
  }
  await proposeAgentAction({
    companyId: turnover.companyId,
    turnoverId,
    agentType: "CLEANER_DISPATCH",
    title: "Send turnover reminder",
    description: `Reminder: ${turnover.property.name} turnover window starts soon.`,
    payload: { reminder: true },
  });
  return { reminded: true };
}

async function markOverdue() {
  const now = new Date();
  const updated = await prisma.turnover.updateMany({
    where: {
      deadlineAt: { lt: now },
      status: { in: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS", "QA_PENDING"] },
    },
    data: { status: "OVERDUE" },
  });
  return { marked: updated.count };
}

async function scanInventory(companyId: string) {
  const items = await prisma.inventoryItem.findMany({ where: { companyId } });
  const low = items.filter((i) => i.quantity <= i.reorderLevel);
  if (low.length) {
    await proposeAgentAction({
      companyId,
      agentType: "INVENTORY_RESTOCK",
      title: `${low.length} inventory alert${low.length === 1 ? "" : "s"}`,
      description: `Low stock: ${low.map((i) => i.name).join(", ")}`,
      payload: { itemIds: low.map((i) => i.id) },
    });
  }
  return { alerts: low.length };
}
