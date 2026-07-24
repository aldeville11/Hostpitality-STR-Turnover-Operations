/**
 * Cookie helpers for aos_session (ADR 0002).
 */

export const SESSION_COOKIE_NAME = "aos_session";

export type SessionCookieOptions = {
  secure: boolean;
  maxAgeSeconds: number;
};

export function buildSessionCookie(
  token: string,
  options: SessionCookieOptions
): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${options.maxAgeSeconds}`,
  ];
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return rest.join("=") || null;
    }
  }
  return null;
}
