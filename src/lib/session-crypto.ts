import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getServerEnv } from "./env.server";

const TOKEN_BYTES = 32;

export function generateRawSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(rawToken: string): string {
  const pepper = getServerEnv().sessionPepper || process.env.SESSION_PEPPER || "dev-pepper-not-for-production";
  return createHmac("sha256", pepper).update(rawToken).digest("hex");
}

export function sessionTokensMatch(rawToken: string, storedHash: string): boolean {
  if (!rawToken || !storedHash) return false;
  const computed = hashSessionToken(rawToken);
  const a = Buffer.from(computed);
  const b = Buffer.from(storedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getSessionCookieName(): string {
  return getServerEnv().isProduction ? "__Host-hp_session" : "hp_session";
}

export const SESSION_DAYS = 14;

export function sessionExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}
