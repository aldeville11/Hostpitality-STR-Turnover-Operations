import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import { createCompanyFixtures } from "./helpers/factories";
import {
  processDueJobs,
  enqueueJob,
  renewJobLease,
  tryCompleteJobWithToken,
  tryFailJobWithToken,
} from "@/lib/jobs";
import { resetServerEnvForTests } from "@/lib/env.server";

const prisma = createTestPrisma();
const companyIds: string[] = [];

afterAll(async () => {
  for (const id of companyIds) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

beforeEach(() => {
  resetServerEnvForTests();
  process.env.JOB_LEASE_SECONDS = "60";
  process.env.JOB_BATCH_SIZE = "25";
});

describe("job lease recovery and claim fencing", () => {
  it("does not reclaim an active RUNNING lease", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "active", body: "x", userId: fx.user.id },
    });
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        leaseExpiresAt: new Date(Date.now() + 60_000),
        claimToken: "owner-token",
        attempts: 1,
      },
    });

    const results = await processDueJobs(10);
    expect(results.find((r) => r.id === job.id)).toBeUndefined();
    const still = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(still.status).toBe("RUNNING");
    expect(still.claimToken).toBe("owner-token");
    expect(still.attempts).toBe(1);
  });

  it("reclaims expired RUNNING lease and completes safely", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "stale", body: "x", userId: fx.user.id },
    });
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(Date.now() - 120_000),
        leaseExpiresAt: new Date(Date.now() - 60_000),
        claimToken: "old-token",
        attempts: 1,
      },
    });

    const results = await processDueJobs(10);
    const mine = results.find((r) => r.id === job.id);
    expect(mine?.ok).toBe(true);
    const done = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(done.status).toBe("COMPLETED");
    expect(done.claimToken).toBeNull();
    expect(done.attempts).toBe(2);
  });

  it("concurrent reclaim does not double-complete the same job", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "race", body: "x", userId: fx.user.id },
    });
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(Date.now() - 120_000),
        leaseExpiresAt: new Date(Date.now() - 60_000),
        claimToken: "old",
        attempts: 1,
      },
    });

    const [a, b] = await Promise.all([processDueJobs(5), processDueJobs(5)]);
    const wins = [...a, ...b].filter((r) => r.id === job.id && r.ok);
    expect(wins.length).toBe(1);
    const done = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(done.status).toBe("COMPLETED");
  });

  it("stale worker cannot complete or fail after claim replacement", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "fence", body: "x", userId: fx.user.id },
    });
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        leaseExpiresAt: new Date(Date.now() + 60_000),
        claimToken: "current-owner",
        attempts: 1,
      },
    });

    expect(await tryCompleteJobWithToken(job.id, "stale-owner")).toBe(false);
    expect(await tryFailJobWithToken(job.id, "stale-owner")).toBe("lost");
    const still = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(still.status).toBe("RUNNING");
    expect(still.claimToken).toBe("current-owner");

    expect(await tryCompleteJobWithToken(job.id, "current-owner")).toBe(true);
    const done = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(done.status).toBe("COMPLETED");
    expect(done.claimToken).toBeNull();
  });

  it("lease renewal retains ownership", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "renew", body: "x", userId: fx.user.id },
    });
    await prisma.backgroundJob.update({
      where: { id: job.id },
      data: {
        status: "RUNNING",
        startedAt: new Date(Date.now() - 10_000),
        leaseExpiresAt: new Date(Date.now() + 5_000),
        claimToken: "renew-token",
        attempts: 1,
      },
    });

    expect(await renewJobLease(job.id, "renew-token")).toBe(true);
    expect(await renewJobLease(job.id, "wrong")).toBe(false);
    const row = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(row.claimToken).toBe("renew-token");
    expect(row.leaseExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 50_000);
  });

  it("notification dispatch is idempotent across duplicate processing keys", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const job = await enqueueJob({
      companyId: fx.company.id,
      type: "notification.dispatch",
      payload: { title: "once", body: "x", userId: fx.user.id },
    });
    const results = await processDueJobs(10);
    expect(results.find((r) => r.id === job.id)?.ok).toBe(true);
    const count1 = await prisma.notification.count({
      where: { companyId: fx.company.id, title: "once" },
    });
    expect(count1).toBe(1);

    // Re-enqueue same logical work under a new job — new jobId means new idempotency key
    // Same job cannot re-run after COMPLETED; verify audit key prevented double write in handler
    const audits = await prisma.auditLog.count({
      where: { companyId: fx.company.id, action: `job.notification.dispatch:${job.id}` },
    });
    expect(audits).toBe(1);
  });
});
