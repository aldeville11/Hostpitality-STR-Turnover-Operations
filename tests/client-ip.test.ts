import { describe, it, expect, beforeEach } from "vitest";
import { resolveClientIp } from "@/lib/client-ip";
import { resetServerEnvForTests } from "@/lib/env.server";

function headers(map: Record<string, string>) {
  return {
    get(name: string) {
      return map[name.toLowerCase()] ?? null;
    },
  };
}

describe("client IP proxy policy", () => {
  beforeEach(() => {
    resetServerEnvForTests();
    delete process.env.VERCEL;
  });

  it("ignores spoofed forwarding headers when TRUST_PROXY is none", () => {
    process.env.TRUST_PROXY = "none";
    const resolved = resolveClientIp(
      headers({
        "x-forwarded-for": "203.0.113.9, 10.0.0.1",
        "x-real-ip": "198.51.100.7",
      })
    );
    expect(resolved).toEqual({ ip: "unknown", source: "unknown" });
  });

  it("rejects malformed forwarded headers in vercel mode", () => {
    process.env.TRUST_PROXY = "vercel";
    expect(
      resolveClientIp(headers({ "x-forwarded-for": "not-an-ip", "x-real-ip": "also-bad" }))
    ).toEqual({ ip: "unknown", source: "unknown" });
  });

  it("uses leftmost vercel forwarded address when valid", () => {
    process.env.TRUST_PROXY = "vercel";
    expect(
      resolveClientIp(headers({ "x-vercel-forwarded-for": "203.0.113.50, 10.0.0.1" }))
    ).toEqual({ ip: "203.0.113.50", source: "vercel" });
  });

  it("single-hop prefers x-real-ip and ignores multi-hop client spoofing of later hops", () => {
    process.env.TRUST_PROXY = "single-hop";
    expect(
      resolveClientIp(
        headers({
          "x-real-ip": "198.51.100.20",
          "x-forwarded-for": "203.0.113.1, 198.51.100.20",
        })
      )
    ).toEqual({ ip: "198.51.100.20", source: "real-ip" });
  });
});
