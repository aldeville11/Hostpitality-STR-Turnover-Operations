import { createHash } from "crypto";
import { createClient, type RedisClientType } from "redis";
import { getServerEnv } from "./env.server";
import { log } from "./logger";

export const RATE_LIMIT_WINDOWS = {
  login: 15 * 60,
  signup: 60 * 60,
  signupIpAbuse: 24 * 60 * 60,
} as const;

export const RATE_LIMIT_THRESHOLDS = {
  loginEmail: 5,
  loginIpPrefix: 30,
  loginCombined: 10,
  signupEmail: 3,
  signupIpPrefix: 10,
  signupIpAbuse: 50,
} as const;

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

async function getRedis(): Promise<RedisClientType | null> {
  const { redisUrl } = getServerEnv();
  if (!redisUrl) return null;

  if (redisClient?.isOpen) return redisClient;

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const client = createClient({ url: redisUrl });
        client.on("error", (err) => {
          log.error("redis.error", { message: err.message });
        });
        await client.connect();
        redisClient = client as RedisClientType;
        return redisClient;
      } catch (err) {
        log.error("redis.connect_failed", {
          message: err instanceof Error ? err.message : String(err),
        });
        return null;
      } finally {
        connectPromise = null;
      }
    })();
  }

  return connectPromise;
}

function hashIdentifier(kind: string, value: string): string {
  const pepper = getServerEnv().rateLimitPepper || "dev-rate-limit-pepper";
  return createHash("sha256")
    .update(`${pepper}:${kind}:${value}`)
    .digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** IPv4 /48-style prefix; IPv6 /64-style prefix — hashed, never stored raw. */
export function ipPrefixHash(ip: string): string {
  const trimmed = ip.trim();
  if (!trimmed) return hashIdentifier("ip", "unknown");

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const prefix = parts.slice(0, 4).join(":");
    return hashIdentifier("ip6", prefix);
  }

  const octets = trimmed.split(".");
  const prefix = octets.slice(0, 3).join(".");
  return hashIdentifier("ip4", prefix);
}

async function incrementCounter(key: string, windowSec: number): Promise<number> {
  const client = await getRedis();
  if (!client) throw new Error("RATE_LIMIT_UNAVAILABLE");

  const count = await client.incr(key);
  if (count === 1) {
    await client.expire(key, windowSec);
  }
  return count;
}

async function checkLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const count = await incrementCounter(key, windowSec);
  return count <= limit;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "RATE_LIMITED" }
  | { ok: false; reason: "UNAVAILABLE" };

export async function checkLoginRateLimits(input: {
  email: string;
  ip: string;
}): Promise<RateLimitResult> {
  try {
    const email = normalizeEmail(input.email);
    const emailHash = hashIdentifier("login-email", email);
    const ipHash = ipPrefixHash(input.ip);
    const combinedHash = hashIdentifier("login-combined", `${email}:${ipHash}`);

    const checks = await Promise.all([
      checkLimit(`rl:login:email:${emailHash}`, RATE_LIMIT_THRESHOLDS.loginEmail, RATE_LIMIT_WINDOWS.login),
      checkLimit(`rl:login:ip:${ipHash}`, RATE_LIMIT_THRESHOLDS.loginIpPrefix, RATE_LIMIT_WINDOWS.login),
      checkLimit(
        `rl:login:combo:${combinedHash}`,
        RATE_LIMIT_THRESHOLDS.loginCombined,
        RATE_LIMIT_WINDOWS.login
      ),
    ]);

    if (checks.every(Boolean)) return { ok: true };
    return { ok: false, reason: "RATE_LIMITED" };
  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMIT_UNAVAILABLE") {
      log.error("rate_limit.unavailable", { route: "login" });
      return { ok: false, reason: "UNAVAILABLE" };
    }
    log.error("rate_limit.error", { route: "login", message: String(err) });
    return { ok: false, reason: "UNAVAILABLE" };
  }
}

export async function checkSignupRateLimits(input: {
  email: string;
  ip: string;
}): Promise<RateLimitResult> {
  try {
    const email = normalizeEmail(input.email);
    const emailHash = hashIdentifier("signup-email", email);
    const ipHash = ipPrefixHash(input.ip);

    const checks = await Promise.all([
      checkLimit(`rl:signup:email:${emailHash}`, RATE_LIMIT_THRESHOLDS.signupEmail, RATE_LIMIT_WINDOWS.signup),
      checkLimit(`rl:signup:ip:${ipHash}`, RATE_LIMIT_THRESHOLDS.signupIpPrefix, RATE_LIMIT_WINDOWS.signup),
      checkLimit(
        `rl:signup:ip-abuse:${ipHash}`,
        RATE_LIMIT_THRESHOLDS.signupIpAbuse,
        RATE_LIMIT_WINDOWS.signupIpAbuse
      ),
    ]);

    if (checks.every(Boolean)) return { ok: true };
    return { ok: false, reason: "RATE_LIMITED" };
  } catch (err) {
    if (err instanceof Error && err.message === "RATE_LIMIT_UNAVAILABLE") {
      log.error("rate_limit.unavailable", { route: "signup" });
      return { ok: false, reason: "UNAVAILABLE" };
    }
    log.error("rate_limit.error", { route: "signup", message: String(err) });
    return { ok: false, reason: "UNAVAILABLE" };
  }
}

/** Disconnect Redis — for tests. */
export async function disconnectRateLimitRedis() {
  if (redisClient?.isOpen) {
    await redisClient.quit();
  }
  redisClient = null;
}

/** Expose hash helpers for privacy tests. */
export const rateLimitInternals = {
  hashIdentifier,
  ipPrefixHash,
  normalizeEmail,
};
