import { describe, it, expect, beforeEach } from "vitest";
import {
  generateRawSessionToken,
  hashSessionToken,
  sessionTokensMatch,
} from "@/lib/session-crypto";
import { resetServerEnvForTests } from "@/lib/env.server";

describe("session crypto", () => {
  beforeEach(() => {
    resetServerEnvForTests();
    process.env.SESSION_PEPPER = "test-pepper-value-32-characters-min";
  });

  it("generates unique raw tokens", () => {
    const a = generateRawSessionToken();
    const b = generateRawSessionToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("hashes tokens deterministically with pepper", () => {
    const raw = "sample-token";
    const h1 = hashSessionToken(raw);
    const h2 = hashSessionToken(raw);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
  });

  it("compares tokens timing-safe", () => {
    const raw = generateRawSessionToken();
    const hash = hashSessionToken(raw);
    expect(sessionTokensMatch(raw, hash)).toBe(true);
    expect(sessionTokensMatch("wrong", hash)).toBe(false);
  });
});
