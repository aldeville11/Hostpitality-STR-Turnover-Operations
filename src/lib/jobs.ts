import { prisma } from "./db";
import { writeAuditLog } from "./audit";

export type JobType =
  | "turnover.remind"
  | "turnover.overdue_check"
  | "notification.dispatch";

export async function enqueueJob(input: {
  companyId?: string | null;
  type: JobType | string;
  payload?: Record<string, unknown>;
  runAt?: Date;
}) {
  return prisma.backgroundJob.create({
    data: {
      companyId: input.companyId ?? null,
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
      results.push({ id: job.id, ok: true as const, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Job failed";
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: message, completedAt: new Date() },
      });
      results.push({ id: job.id, ok: false as const, error: message });
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
    case "turnover.remind":
      return remindTurnover(String(payload.turnoverId ?? ""), companyId);
    case "turnover.overdue_check":
      return markOverdueTurnovers(companyId);
    case "notification.dispatch":
      return dispatchNotification(payload, companyId);
    default:
      return { skipped: true, type };
  }
}

async function remindTurnover(turnoverId: string, companyId: string | null) {
  if (!turnoverId) return { skipped: true, reason: "missing turnoverId" };

  const turnover = await prisma.turnover.findUnique({
    where: { id: turnoverId },
    include: { property: true },
  });

  if (!turnover || turnover.status === "COMPLETED" || turnover.status === "CANCELLED") {
    return { skipped: true };
  }

  const cid = companyId ?? turnover.companyId;
  await prisma.notification.create({
    data: {
      companyId: cid,
      title: "Turnover reminder",
      body: `Reminder: ${turnover.property.name} turnover window starts soon.`,
      type: "reminder",
    },
  });

  await writeAuditLog({
    companyId: cid,
    action: "job.turnover.remind",
    entityType: "Turnover",
    entityId: turnoverId,
  });

  return { reminded: true };
}

async function markOverdueTurnovers(companyId: string | null) {
  const now = new Date();
  const due = await prisma.turnover.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      deadlineAt: { lt: now },
      status: { in: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS"] },
    },
  });

  for (const turnover of due) {
    await prisma.turnover.update({
      where: { id: turnover.id },
      data: { status: "OVERDUE" },
    });
    await prisma.turnoverStatusEvent.create({
      data: {
        turnoverId: turnover.id,
        fromStatus: turnover.status,
        toStatus: "OVERDUE",
        note: "Marked overdue by background job",
        actorName: "system",
      },
    });
    await writeAuditLog({
      companyId: turnover.companyId,
      action: "turnover.status_changed",
      entityType: "Turnover",
      entityId: turnover.id,
      metadata: { from: turnover.status, to: "OVERDUE", source: "job" },
    });
  }

  return { marked: due.length };
}

async function dispatchNotification(
  payload: Record<string, unknown>,
  companyId: string | null
) {
  if (!companyId) return { skipped: true, reason: "missing companyId" };

  const notification = await prisma.notification.create({
    data: {
      companyId,
      userId: payload.userId ? String(payload.userId) : null,
      title: String(payload.title ?? "Notification"),
      body: String(payload.body ?? ""),
      type: String(payload.type ?? "info"),
    },
  });

  return { notificationId: notification.id };
}

/** Schedule a reminder before a turnover window starts. */
export async function scheduleTurnoverReminder(input: {
  companyId: string;
  turnoverId: string;
  windowStart: Date;
  hoursBefore?: number;
}) {
  const hoursBefore = input.hoursBefore ?? 2;
  const runAt = new Date(input.windowStart.getTime() - hoursBefore * 60 * 60 * 1000);
  return enqueueJob({
    companyId: input.companyId,
    type: "turnover.remind",
    payload: { turnoverId: input.turnoverId },
    runAt: runAt < new Date() ? new Date() : runAt,
  });
}
