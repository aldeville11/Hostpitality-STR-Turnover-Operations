import { createHmac, randomBytes } from "node:crypto";

/** Opaque session token — never store plaintext; hash with SESSION_PEPPER (ADR 0002). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, pepper: string): string {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}
