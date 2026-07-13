import { getServerEnv } from "./env.server";

export type ClientIpResolution = {
  /** Normalized IP used for rate-limit hashing, or "unknown". Never log this raw in production logs without redaction. */
  ip: string;
  source: "vercel" | "real-ip" | "forwarded" | "unknown";
};

function isValidIpLiteral(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 128) return false;
  // Basic IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) {
    return v.split(".").every((o) => {
      const n = Number(o);
      return n >= 0 && n <= 255;
    });
  }
  // Basic IPv6 (compressed forms allowed)
  if (v.includes(":") && /^[0-9a-fA-F:]+$/.test(v) && v.length >= 2) {
    return true;
  }
  return false;
}

/**
 * Resolve client IP for rate limiting according to TRUST_PROXY / Vercel policy.
 *
 * Default (`none`): do not trust arbitrary X-Forwarded-For / X-Real-IP.
 * Email/combined rate limits still apply when IP identity is "unknown".
 *
 * Vercel: platform sets forwarding headers; leftmost address is the client.
 * single-hop: for a single trusted reverse proxy that overwrites X-Real-IP / XFF.
 */
export function resolveClientIp(headers: {
  get(name: string): string | null;
}): ClientIpResolution {
  const mode = getServerEnv().trustProxyMode;

  if (mode === "none") {
    return { ip: "unknown", source: "unknown" };
  }

  if (mode === "vercel") {
    const vercelForwarded = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (vercelForwarded && isValidIpLiteral(vercelForwarded)) {
      return { ip: vercelForwarded, source: "vercel" };
    }
    const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (xff && isValidIpLiteral(xff)) {
      return { ip: xff, source: "forwarded" };
    }
    return { ip: "unknown", source: "unknown" };
  }

  // single-hop: prefer X-Real-IP set by the trusted proxy, else leftmost XFF
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isValidIpLiteral(realIp)) {
    return { ip: realIp, source: "real-ip" };
  }
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff && isValidIpLiteral(xff)) {
    return { ip: xff, source: "forwarded" };
  }
  return { ip: "unknown", source: "unknown" };
}
