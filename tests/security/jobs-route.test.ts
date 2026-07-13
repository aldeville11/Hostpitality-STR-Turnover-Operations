import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { createTestPrisma } from "../helpers/db-guard";
import { createCompanyFixtures } from "../helpers/factories";
import { GET, POST } from "@/app/api/jobs/process/route";
import { resetServerEnvForTests } from "@/lib/env.server";
import { processDueJobs } from "@/lib/jobs";

const prisma = createTestPrisma();
const companyIds: string[] = [];

afterAll(async () => {
  for (const id of companyIds) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

function setCronEnv(secret = "test-cron-secret-value") {
  resetServerEnvForTests();
  process.env.CRON_SECRET = secret;
  process.env.CRON_SECRET_PREVIOUS = "previous-cron-secret";
  process.env.JOB_BATCH_SIZE = "25";
  process.env.SESSION_PEPPER = process.env.SESSION_PEPPER ?? "test-session-pepper-32chars-min";
  process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
  process.env.RATE_LIMIT_PEPPER = process.env.RATE_LIMIT_PEPPER ?? "test-rate-limit-pepper";
}

describe("POST /api/jobs/process HTTP integration", () => {
  beforeEach(() => {
    setCronEnv();
  });

  it("GET returns 405", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toBe("Method not allowed");
  });

  it("POST without credentials returns 401", async () => {
    const res = await POST(new Request("http://localhost/api/jobs/process", { method: "POST" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(JSON.stringify(body)).not.toMatch(/stack|CRON|secret|password/i);
  });

  it("POST with incorrect secret returns 401", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs/process", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("POST with current CRON_SECRET succeeds", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    await prisma.backgroundJob.create({
      data: {
        companyId: fixtures.company.id,
        type: "notification.dispatch",
        status: "PENDING",
        runAt: new Date(Date.now() - 1000),
        payloadJson: JSON.stringify({ title: "Hello", body: "World" }),
      },
    });

    const res = await POST(
      new Request("http://localhost/api/jobs/process", {
        method: "POST",
        headers: { "x-cron-secret": "test-cron-secret-value" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.processed).toBe("number");
    expect(body.results).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/stack|Hello|World|password|pepper/i);
  });

  it("previous cron secret succeeds during rotation window", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs/process", {
        method: "POST",
        headers: { authorization: "Bearer previous-cron-secret" },
      })
    );
    expect(res.status).toBe(200);
  });

  it("session cookies do not authorize the route", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs/process", {
        method: "POST",
        headers: {
          cookie: "hp_session=admin-session-token; __Host-hp_session=admin-session-token",
        },
      })
    );
    expect(res.status).toBe(401);
  });

  it("batch size cannot exceed configured maximum via query", async () => {
    resetServerEnvForTests();
    process.env.CRON_SECRET = "test-cron-secret-value";
    process.env.JOB_BATCH_SIZE = "2";

    const fixtures = await createCompanyFixtures(prisma, "B");
    companyIds.push(fixtures.company.id);
    for (let i = 0; i < 5; i++) {
      await prisma.backgroundJob.create({
        data: {
          companyId: fixtures.company.id,
          type: "notification.dispatch",
          status: "PENDING",
          runAt: new Date(Date.now() - 1000),
          payloadJson: JSON.stringify({ title: `Job ${i}` }),
        },
      });
    }

    const res = await POST(
      new Request("http://localhost/api/jobs/process?limit=9999", {
        method: "POST",
        headers: { "x-cron-secret": "test-cron-secret-value" },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBeLessThanOrEqual(2);
  });

  it("requires companyId on jobs and scopes handlers", async () => {
    const a = await createCompanyFixtures(prisma, "A");
    const b = await createCompanyFixtures(prisma, "B");
    companyIds.push(a.company.id, b.company.id);

    // Clear B's pending fixture jobs so only the cross-tenant remind is under test
    await prisma.backgroundJob.deleteMany({ where: { companyId: b.company.id } });
    await prisma.notification.deleteMany({ where: { companyId: b.company.id } });

    await prisma.backgroundJob.create({
      data: {
        companyId: a.company.id,
        type: "turnover.remind",
        status: "PENDING",
        runAt: new Date(Date.now() - 1000),
        payloadJson: JSON.stringify({ turnoverId: b.turnover.id }),
      },
    });

    const beforeB = await prisma.notification.count({ where: { companyId: b.company.id } });
    await processDueJobs(10);
    const afterB = await prisma.notification.count({ where: { companyId: b.company.id } });
    expect(afterB).toBe(beforeB);

    const orphan = await prisma.backgroundJob.create({
      data: {
        companyId: null,
        type: "notification.dispatch",
        status: "PENDING",
        runAt: new Date(Date.now() - 1000),
        payloadJson: JSON.stringify({ title: "orphan" }),
      },
    });
    const results = await processDueJobs(10);
    const claimed = await prisma.backgroundJob.findUnique({ where: { id: orphan.id } });
    // Null companyId jobs are skipped by claim query
    expect(claimed?.status).toBe("PENDING");
    expect(results.every((r) => typeof r.id === "string")).toBe(true);
  });

  it("concurrent claims do not double-process the same job", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    const job = await prisma.backgroundJob.create({
      data: {
        companyId: fixtures.company.id,
        type: "notification.dispatch",
        status: "PENDING",
        runAt: new Date(Date.now() - 1000),
        payloadJson: JSON.stringify({ title: "once" }),
      },
    });

    const [r1, r2] = await Promise.all([processDueJobs(5), processDueJobs(5)]);
    const ids = [...r1, ...r2].map((r) => r.id).filter((id) => id === job.id);
    expect(ids.length).toBeLessThanOrEqual(1);
    const final = await prisma.backgroundJob.findUnique({ where: { id: job.id } });
    expect(["COMPLETED", "FAILED", "RUNNING", "PENDING"]).toContain(final?.status ?? "");
  });

  it("failed jobs produce safe structured results without sensitive leakage", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    await prisma.backgroundJob.create({
      data: {
        companyId: fixtures.company.id,
        type: "turnover.remind",
        status: "PENDING",
        runAt: new Date(Date.now() - 1000),
        payloadJson: JSON.stringify({ turnoverId: "missing", secret: "should-not-leak" }),
        attempts: 2,
      },
    });

    const res = await POST(
      new Request("http://localhost/api/jobs/process", {
        method: "POST",
        headers: { "x-cron-secret": "test-cron-secret-value" },
      })
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(JSON.stringify(body)).not.toContain("should-not-leak");
    expect(JSON.stringify(body)).not.toMatch(/at Object\.|stack/i);
  });
});
