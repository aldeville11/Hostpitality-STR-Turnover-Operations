import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";
import { captureError, log } from "./logger";
import { getServerEnv } from "./env.server";

export type JobType =
  | "turnover.remind"
  | "turnover.overdue_check"
  | "notification.dispatch";

export const MAX_JOB_ATTEMPTS = 3;

export async function enqueueJob(input: {
  companyId: string;
  type: JobType | string;
  payload?: Record<string, unknown>;
  runAt?: Date;
}) {
  if (!input.companyId) {
    throw new Error("companyId is required for background jobs");
  }
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

export async function processDueJobs(limit?: number) {
  const env = getServerEnv();
  const batchSize = Math.min(limit ?? env.jobBatchSize, env.jobBatchSize);
  const now = new Date();
  const leaseMs = env.jobLeaseSeconds * 1000;
  const staleBefore = new Date(now.getTime() - leaseMs);

  const jobs = await prisma.$transaction(async (tx) => {
    const candidates = await tx.backgroundJob.findMany({
      where: {
        companyId: { not: null },
        OR: [
          { status: "PENDING", runAt: { lte: now } },
          { status: "RUNNING", startedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { runAt: "asc" },
      take: batchSize,
    });

    const claimed = [];
    for (const job of candidates) {
      const updated = await tx.backgroundJob.updateMany({
        where: {
          id: job.id,
          OR: [
            { status: "PENDING" },
            { status: "RUNNING", startedAt: { lt: staleBefore } },
          ],
        },
        data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
      });
      if (updated.count === 1) {
        if (job.status === "RUNNING") {
          log.warn("job.stale_reclaimed", {
            jobId: job.id,
            type: job.type,
            companyId: job.companyId,
            previousStartedAt: job.startedAt,
            leaseSeconds: env.jobLeaseSeconds,
          });
        }
        claimed.push({ ...job, attempts: job.attempts });
      }
    }

    return claimed;
  });

  const results = [];

  for (const job of jobs) {
    if (!job.companyId) {
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: "Missing companyId",
          completedAt: new Date(),
        },
      });
      results.push({ id: job.id, ok: false as const, error: "Missing companyId" });
      continue;
    }

    try {
      const payload = parseJson<Record<string, unknown>>(job.payloadJson, {});
      const result = await handleJob(job.type, payload, job.companyId);
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          error: null,
          payloadJson: JSON.stringify({ ...payload, result }),
        },
      });
      log.info("job.completed", { jobId: job.id, type: job.type, companyId: job.companyId });
      results.push({ id: job.id, ok: true as const, result });
    } catch (err) {
      const message = captureError(err, { jobId: job.id, type: job.type });
      const attempts = job.attempts + 1;
      const retryable = attempts < MAX_JOB_ATTEMPTS;
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: retryable ? "PENDING" : "FAILED",
          error: message,
          completedAt: retryable ? null : new Date(),
          runAt: retryable
            ? new Date(Date.now() + attempts * 60 * 1000)
            : job.runAt,
        },
      });
      results.push({
        id: job.id,
        ok: false as const,
        error: message,
        retrying: retryable,
      });
    }
  }

  return results;
}

/** Re-queue failed jobs that still have attempts remaining (or force one more try). */
export async function retryFailedJobs(input: {
  companyId: string;
  limit?: number;
  force?: boolean;
}) {
  const failed = await prisma.backgroundJob.findMany({
    where: {
      companyId: input.companyId,
      status: "FAILED",
      ...(input.force ? {} : { attempts: { lt: MAX_JOB_ATTEMPTS } }),
    },
    orderBy: { completedAt: "desc" },
    take: input.limit ?? 20,
  });

  for (const job of failed) {
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        runAt: new Date(),
        error: null,
        completedAt: null,
        ...(input.force ? { attempts: Math.max(0, job.attempts - 1) } : {}),
      },
    });
  }

  log.info("job.retry_queued", {
    companyId: input.companyId,
    count: failed.length,
    force: Boolean(input.force),
  });

  return { requeued: failed.length, ids: failed.map((j) => j.id) };
}

export async function getJobObservability(companyId: string) {
  const [pending, running, failed, completedRecent] = await Promise.all([
    prisma.backgroundJob.count({ where: { companyId, status: "PENDING" } }),
    prisma.backgroundJob.count({ where: { companyId, status: "RUNNING" } }),
    prisma.backgroundJob.count({ where: { companyId, status: "FAILED" } }),
    prisma.backgroundJob.count({
      where: {
        companyId,
        status: "COMPLETED",
        completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const recentFailed = await prisma.backgroundJob.findMany({
    where: { companyId, status: "FAILED" },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      type: true,
      error: true,
      attempts: true,
      completedAt: true,
      createdAt: true,
    },
  });

  return {
    pending,
    running,
    failed,
    completedRecent,
    recentFailed,
    retryable: recentFailed.filter((j) => j.attempts < MAX_JOB_ATTEMPTS).length,
  };
}

async function handleJob(
  type: string,
  payload: Record<string, unknown>,
  companyId: string
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

async function remindTurnover(turnoverId: string, companyId: string) {
  if (!turnoverId) return { skipped: true, reason: "missing turnoverId" };

  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId },
    include: { property: true },
  });

  if (!turnover || turnover.status === "COMPLETED" || turnover.status === "CANCELLED") {
    return { skipped: true };
  }

  await prisma.notification.create({
    data: {
      companyId,
      title: "Turnover reminder",
      body: `Reminder: ${turnover.property.name} turnover window starts soon.`,
      type: "reminder",
    },
  });

  await writeAuditLog({
    companyId,
    action: "job.turnover.remind",
    entityType: "Turnover",
    entityId: turnoverId,
  });

  return { reminded: true };
}

async function markOverdueTurnovers(companyId: string) {
  const now = new Date();
  const due = await prisma.turnover.findMany({
    where: {
      companyId,
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
  companyId: string
) {
  const userId = payload.userId ? String(payload.userId) : null;
  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true },
    });
    if (!user) return { skipped: true, reason: "invalid userId" };
  }

  const notification = await prisma.notification.create({
    data: {
      companyId,
      userId,
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
