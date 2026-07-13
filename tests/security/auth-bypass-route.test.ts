import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resetServerEnvForTests } from "@/lib/env.server";

const isAuthBypassAllowedMock = vi.fn();
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    isAuthBypassAllowed: () => isAuthBypassAllowedMock(),
    getCurrentUser: async () => null,
    createSession: vi.fn(),
  };
});

describe("auth bypass HTTP route", () => {
  beforeEach(() => {
    resetServerEnvForTests();
    isAuthBypassAllowedMock.mockReset();
  });

  afterEach(() => {
    resetServerEnvForTests();
  });

  it("returns 403 when bypass is not allowed (production / missing ALLOW)", async () => {
    isAuthBypassAllowedMock.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/bypass/route");
    const res = await GET(new Request("http://localhost/api/auth/bypass?next=/dashboard"));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).toEqual({ error: "Unauthorized" });
    expect(JSON.stringify(json).toLowerCase()).not.toContain("password");
  });

  it("legacy AUTH_BYPASS alone cannot enable the route when helper denies", async () => {
    process.env.AUTH_BYPASS = "1";
    isAuthBypassAllowedMock.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/bypass/route");
    const res = await GET(new Request("http://localhost/api/auth/bypass"));
    expect(res.status).toBe(403);
  });

  it("client-controlled headers cannot activate bypass when helper denies", async () => {
    isAuthBypassAllowedMock.mockReturnValue(false);
    const { GET } = await import("@/app/api/auth/bypass/route");
    const res = await GET(
      new Request("http://localhost/api/auth/bypass", {
        headers: {
          "x-allow-auth-bypass": "true",
          authorization: "Bearer bypass",
        },
      })
    );
    expect(res.status).toBe(403);
  });

  it("when explicitly allowed, missing demo user returns safe 404 without secrets", async () => {
    isAuthBypassAllowedMock.mockReturnValue(true);
    const { GET } = await import("@/app/api/auth/bypass/route");
    const res = await GET(new Request("http://localhost/api/auth/bypass"));
    expect([307, 404]).toContain(res.status);
    const body = await res.text();
    expect(body.toLowerCase()).not.toContain("password");
    expect(body).not.toMatch(/[a-f0-9]{64}/);
    expect(body.toLowerCase()).not.toContain("manager@");
    expect(body.toLowerCase()).not.toContain("hostpitality.app");
    expect(body).not.toContain("ALLOW_DEMO_SEED");
  });
});
