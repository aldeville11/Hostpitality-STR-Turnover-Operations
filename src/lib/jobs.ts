import { randomBytes } from "crypto";
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

/** Handler runtime expectations (seconds). Keep well under JOB_LEASE_SECONDS. */
export const JOB_HANDLER_TIMEOUT_SECONDS: Record<string, number> = {
  "turnover.remind": 30,
  "turnover.overdue_check": 120,
  "notification.dispatch": 30,
};

type ClaimedJob = {
  id: string;
  companyId: string | null;
  type: string;
  payloadJson: string;
  attempts: number;
  claimToken: string;
  runAt: Date;
};

function newClaimToken(): string {
  return randomBytes(24).toString("hex");
}

function leaseExpiry(from: Date, leaseSeconds: number): Date {
  return new Date(from.getTime() + leaseSeconds * 1000);
}

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

/** Renew lease for the owning claim. Returns false if ownership was lost. */
export async function renewJobLease(jobId: string, claimToken: string): Promise<boolean> {
  const env = getServerEnv();
  const now = new Date();
  const updated = await prisma.backgroundJob.updateMany({
    where: {
      id: jobId,
      status: "RUNNING",
      claimToken,
    },
    data: {
      startedAt: now,
      leaseExpiresAt: leaseExpiry(now, env.jobLeaseSeconds),
    },
  });
  return updated.count === 1;
}

/** True when this claim still owns the RUNNING job. */
export async function ownsJobClaim(jobId: string, claimToken: string): Promise<boolean> {
  const job = await prisma.backgroundJob.findFirst({
    where: { id: jobId, status: "RUNNING", claimToken },
    select: { id: true },
  });
  return Boolean(job);
}

async function completeJobWithClaim(
  jobId: string,
  claimToken: string,
  data: { payloadJson?: string }
): Promise<boolean> {
  const updated = await prisma.backgroundJob.updateMany({
    where: { id: jobId, status: "RUNNING", claimToken },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      error: null,
      claimToken: null,
      leaseExpiresAt: null,
      ...(data.payloadJson ? { payloadJson: data.payloadJson } : {}),
    },
  });
  if (updated.count !== 1) {
    log.warn("job.lost_claim", { jobId, outcome: "complete_rejected" });
    return false;
  }
  return true;
}

async function failJobWithClaim(
  jobId: string,
  claimToken: string,
  input: { error: string; attempts: number; runAt: Date }
): Promise<"retry" | "failed" | "lost"> {
  const retryable = input.attempts < MAX_JOB_ATTEMPTS;
  const updated = await prisma.backgroundJob.updateMany({
    where: { id: jobId, status: "RUNNING", claimToken },
    data: {
      status: retryable ? "PENDING" : "FAILED",
      error: input.error,
      completedAt: retryable ? null : new Date(),
      claimToken: null,
      leaseExpiresAt: null,
      startedAt: null,
      runAt: retryable
        ? new Date(Date.now() + input.attempts * 60 * 1000)
        : input.runAt,
    },
  });
  if (updated.count !== 1) {
    log.warn("job.lost_claim", { jobId, outcome: "fail_rejected" });
    return "lost";
  }
  return retryable ? "retry" : "failed";
}

export async function processDueJobs(limit?: number) {
  const env = getServerEnv();
  const batchSize = Math.min(limit ?? env.jobBatchSize, env.jobBatchSize);
  const now = new Date();

  const jobs = await prisma.$transaction(async (tx) => {
    const candidates = await tx.backgroundJob.findMany({
      where: {
        companyId: { not: null },
        OR: [
          { status: "PENDING", runAt: { lte: now } },
          {
            status: "RUNNING",
            OR: [
              { leaseExpiresAt: { lt: now } },
              // Legacy rows without leaseExpiresAt: fall back to startedAt age
              { leaseExpiresAt: null, startedAt: { lt: new Date(now.getTime() - env.jobLeaseSeconds * 1000) } },
            ],
          },
        ],
      },
      orderBy: { runAt: "asc" },
      take: batchSize,
    });

    const claimed: ClaimedJob[] = [];
    for (const job of candidates) {
      const claimToken = newClaimToken();
      const startedAt = new Date();
      const updated = await tx.backgroundJob.updateMany({
        where: {
          id: job.id,
          OR: [
            { status: "PENDING" },
            {
              status: "RUNNING",
              OR: [
                { leaseExpiresAt: { lt: now } },
                {
                  leaseExpiresAt: null,
                  startedAt: { lt: new Date(now.getTime() - env.jobLeaseSeconds * 1000) },
                },
              ],
            },
          ],
        },
        data: {
          status: "RUNNING",
          startedAt,
          leaseExpiresAt: leaseExpiry(startedAt, env.jobLeaseSeconds),
          claimToken,
          attempts: { increment: 1 },
        },
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
        claimed.push({
          id: job.id,
          companyId: job.companyId,
          type: job.type,
          payloadJson: job.payloadJson,
          attempts: job.attempts,
          claimToken,
          runAt: job.runAt,
        });
      }
    }

    return claimed;
  });

  const results = [];

  for (const job of jobs) {
    if (!job.companyId) {
      await failJobWithClaim(job.id, job.claimToken, {
        error: "Missing companyId",
        attempts: MAX_JOB_ATTEMPTS,
        runAt: job.runAt,
      });
      results.push({ id: job.id, ok: false as const, error: "Missing companyId" });
      continue;
    }

    try {
      await renewJobLease(job.id, job.claimToken);
      const payload = parseJson<Record<string, unknown>>(job.payloadJson, {});
      const result = await handleJob(job.type, payload, job.companyId, {
        jobId: job.id,
        claimToken: job.claimToken,
      });

      if (!(await ownsJobClaim(job.id, job.claimToken))) {
        log.warn("job.lost_claim", { jobId: job.id, outcome: "aborted_before_complete" });
        results.push({ id: job.id, ok: false as const, error: "Lost claim", lostClaim: true });
        continue;
      }

      const completed = await completeJobWithClaim(job.id, job.claimToken, {
        payloadJson: JSON.stringify({ ...payload, result }),
      });
      if (!completed) {
        results.push({ id: job.id, ok: false as const, error: "Lost claim", lostClaim: true });
        continue;
      }
      log.info("job.completed", { jobId: job.id, type: job.type, companyId: job.companyId });
      results.push({ id: job.id, ok: true as const, result });
    } catch (err) {
      const message = captureError(err, { jobId: job.id, type: job.type });
      const attempts = job.attempts + 1;
      const outcome = await failJobWithClaim(job.id, job.claimToken, {
        error: message,
        attempts,
        runAt: job.runAt,
      });
      results.push({
        id: job.id,
        ok: false as const,
        error: message,
        retrying: outcome === "retry",
        lostClaim: outcome === "lost",
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
        claimToken: null,
        leaseExpiresAt: null,
        startedAt: null,
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

type JobClaimContext = { jobId: string; claimToken: string };

async function handleJob(
  type: string,
  payload: Record<string, unknown>,
  companyId: string,
  claim: JobClaimContext
) {
  switch (type) {
    case "turnover.remind":
      return remindTurnover(String(payload.turnoverId ?? ""), companyId, claim);
    case "turnover.overdue_check":
      return markOverdueTurnovers(companyId, claim);
    case "notification.dispatch":
      return dispatchNotification(payload, companyId, claim);
    default:
      return { skipped: true, type };
  }
}

async function remindTurnover(
  turnoverId: string,
  companyId: string,
  claim: JobClaimContext
) {
  if (!turnoverId) return { skipped: true, reason: "missing turnoverId" };

  // Idempotent: one reminder audit per turnover (at-most-once across retries/duplicates)
  const prior = await prisma.auditLog.findFirst({
    where: {
      companyId,
      action: "job.turnover.remind",
      entityType: "Turnover",
      entityId: turnoverId,
    },
    select: { id: true },
  });
  if (prior) return { skipped: true, reason: "already_reminded" };

  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId },
    include: { property: true },
  });

  if (!turnover || turnover.status === "COMPLETED" || turnover.status === "CANCELLED") {
    return { skipped: true };
  }

  if (!(await ownsJobClaim(claim.jobId, claim.claimToken))) {
    return { skipped: true, reason: "lost_claim" };
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

async function markOverdueTurnovers(companyId: string, claim: JobClaimContext) {
  await renewJobLease(claim.jobId, claim.claimToken);

  const now = new Date();
  const due = await prisma.turnover.findMany({
    where: {
      companyId,
      deadlineAt: { lt: now },
      status: { in: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS"] },
    },
  });

  let marked = 0;
  for (const turnover of due) {
    if (!(await ownsJobClaim(claim.jobId, claim.claimToken))) {
      return { marked, aborted: true, reason: "lost_claim" };
    }
    // Conditional update — natural idempotency if already OVERDUE
    const updated = await prisma.turnover.updateMany({
      where: {
        id: turnover.id,
        companyId,
        status: { in: ["SCHEDULED", "ASSIGNED", "IN_PROGRESS"] },
      },
      data: { status: "OVERDUE" },
    });
    if (updated.count !== 1) continue;

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
    marked += 1;
  }

  return { marked };
}

async function dispatchNotification(
  payload: Record<string, unknown>,
  companyId: string,
  claim: JobClaimContext
) {
  const userId = payload.userId ? String(payload.userId) : null;
  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { id: true },
    });
    if (!user) return { skipped: true, reason: "invalid userId" };
  }

  // Deterministic idempotency via job-scoped audit key when reprocessed
  const idempotencyKey = `job.notification.dispatch:${claim.jobId}`;
  const prior = await prisma.auditLog.findFirst({
    where: { companyId, action: idempotencyKey },
    select: { id: true },
  });
  if (prior) return { skipped: true, reason: "already_dispatched" };

  if (!(await ownsJobClaim(claim.jobId, claim.claimToken))) {
    return { skipped: true, reason: "lost_claim" };
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

  await writeAuditLog({
    companyId,
    action: idempotencyKey,
    entityType: "Notification",
    entityId: notification.id,
    metadata: { jobId: claim.jobId },
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

/** Test helper: attempt terminal update with an arbitrary claim token. */
export async function tryCompleteJobWithToken(jobId: string, claimToken: string) {
  return completeJobWithClaim(jobId, claimToken, {});
}

export async function tryFailJobWithToken(jobId: string, claimToken: string) {
  return failJobWithClaim(jobId, claimToken, {
    error: "forced",
    attempts: 1,
    runAt: new Date(),
  });
}
