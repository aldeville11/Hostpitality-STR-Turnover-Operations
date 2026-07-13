import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rateLimitInternals, checkLoginRateLimits, disconnectRateLimitRedis } from "@/lib/rate-limit";
import { resetServerEnvForTests } from "@/lib/env.server";

describe("rate limiting", () => {
  beforeEach(() => {
    resetServerEnvForTests();
    process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    process.env.RATE_LIMIT_PEPPER = "test-rate-pepper";
  });

  afterEach(async () => {
    await disconnectRateLimitRedis();
  });

  it("hashes email without storing raw value in keys", () => {
    const hash = rateLimitInternals.hashIdentifier("email", "user@example.com");
    expect(hash).not.toContain("user@example.com");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes IP prefix without storing full IP", () => {
    const hash = rateLimitInternals.ipPrefixHash("203.0.113.45");
    expect(hash).not.toContain("203.0.113.45");
  });

  it("enforces login email limit", async () => {
    const email = `ratelimit-${Date.now()}-${Math.random().toString(16).slice(2)}@test.hostpitality.app`;
    const ip = `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
    for (let i = 0; i < 5; i++) {
      const result = await checkLoginRateLimits({ email, ip });
      expect(result.ok).toBe(true);
    }
    const blocked = await checkLoginRateLimits({ email, ip });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("RATE_LIMITED");
  });
});
