import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAuthBypassAllowed } from "@/lib/auth";
import { resetServerEnvForTests } from "@/lib/env.server";

function setNodeEnv(value: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe("authentication bypass", () => {
  const original = { ...process.env };

  beforeEach(() => {
    resetServerEnvForTests();
  });

  afterEach(() => {
    Object.assign(process.env, original);
    resetServerEnvForTests();
  });

  it("rejects bypass in production even with legacy AUTH_BYPASS=1", () => {
    setNodeEnv("production");
    process.env.ALLOW_AUTH_BYPASS = "true";
    process.env.AUTH_BYPASS = "1";
    expect(isAuthBypassAllowed()).toBe(false);
  });

  it("requires explicit ALLOW_AUTH_BYPASS in development", () => {
    setNodeEnv("development");
    delete process.env.ALLOW_AUTH_BYPASS;
    expect(isAuthBypassAllowed()).toBe(false);
  });

  it("allows bypass only with ALLOW_AUTH_BYPASS=true in development", () => {
    setNodeEnv("development");
    process.env.ALLOW_AUTH_BYPASS = "true";
    expect(isAuthBypassAllowed()).toBe(true);
  });

  it("rejects bypass when AUTH_BYPASS=0", () => {
    setNodeEnv("development");
    process.env.ALLOW_AUTH_BYPASS = "true";
    process.env.AUTH_BYPASS = "0";
    expect(isAuthBypassAllowed()).toBe(false);
  });
});
