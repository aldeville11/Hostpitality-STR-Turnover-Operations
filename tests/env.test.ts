import { describe, it, expect, beforeEach } from "vitest";
import { getServerEnv, resetServerEnvForTests } from "@/lib/env.server";

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe("environment validation", () => {
  beforeEach(() => {
    resetServerEnvForTests();
  });

  it("rejects SQLite database URL in production", () => {
    setNodeEnv("production");
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.SESSION_PEPPER = "pepper";
    process.env.CRON_SECRET = "cron";
    process.env.REDIS_URL = "redis://localhost";
    process.env.RATE_LIMIT_PEPPER = "rl";

    expect(() => getServerEnv()).toThrow(/SQLite/);
  });

  it("rejects auth bypass in production", () => {
    setNodeEnv("production");
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.SESSION_PEPPER = "pepper";
    process.env.CRON_SECRET = "cron";
    process.env.REDIS_URL = "redis://localhost";
    process.env.RATE_LIMIT_PEPPER = "rl";
    process.env.ALLOW_AUTH_BYPASS = "true";

    expect(() => getServerEnv()).toThrow(/ALLOW_AUTH_BYPASS/);
  });

  it("bounds JOB_LEASE_SECONDS", () => {
    setNodeEnv("test");
    process.env.TEST_DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.JOB_LEASE_SECONDS = "1";
    expect(() => getServerEnv()).toThrow(/JOB_LEASE_SECONDS/);

    resetServerEnvForTests();
    process.env.JOB_LEASE_SECONDS = "99999";
    expect(() => getServerEnv()).toThrow(/JOB_LEASE_SECONDS/);

    resetServerEnvForTests();
    process.env.JOB_LEASE_SECONDS = "nope";
    expect(() => getServerEnv()).toThrow(/JOB_LEASE_SECONDS/);

    resetServerEnvForTests();
    delete process.env.JOB_LEASE_SECONDS;
    expect(getServerEnv().jobLeaseSeconds).toBe(900);

    resetServerEnvForTests();
    process.env.JOB_LEASE_SECONDS = "120";
    expect(getServerEnv().jobLeaseSeconds).toBe(120);
  });
});
