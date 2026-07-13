import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import { createCompanyFixtures } from "./helpers/factories";
import { processDueJobs, enqueueJob } from "@/lib/jobs";
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
  process.env.JOB_LEASE_SECONDS = "1";
  process.env.JOB_BATCH_SIZE = "25";
});

describe("job lease recovery", () => {
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
      data: { status: "RUNNING", startedAt: new Date(), attempts: 1 },
    });

    const results = await processDueJobs(10);
    expect(results.find((r) => r.id === job.id)).toBeUndefined();
    const still = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(still.status).toBe("RUNNING");
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
        startedAt: new Date(Date.now() - 60_000),
        attempts: 1,
      },
    });

    const results = await processDueJobs(10);
    const mine = results.find((r) => r.id === job.id);
    expect(mine?.ok).toBe(true);
    const done = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(done.status).toBe("COMPLETED");
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
        startedAt: new Date(Date.now() - 60_000),
        attempts: 1,
      },
    });

    const [a, b] = await Promise.all([processDueJobs(5), processDueJobs(5)]);
    const wins = [...a, ...b].filter((r) => r.id === job.id && r.ok);
    expect(wins.length).toBe(1);
    const done = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: job.id } });
    expect(done.status).toBe("COMPLETED");
  });
});
