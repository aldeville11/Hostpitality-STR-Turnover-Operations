import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { can, type Permission } from "./rbac";
import { writeAuditLog } from "./audit";
import { getServerEnv } from "./env.server";
import {
  generateRawSessionToken,
  getSessionCookieName,
  hashSessionToken,
  sessionExpiresAt,
  sessionTokensMatch,
  SESSION_DAYS,
} from "./session-crypto";
import { checkLoginRateLimits } from "./rate-limit";

export type AuthUser = User & {
  company: {
    id: string;
    name: string;
    slug: string;
    onboardedAt: Date | null;
  } | null;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function createSession(userId: string, opts?: { revokeOthers?: boolean }) {
  if (opts?.revokeOthers ?? true) {
    await revokeAllSessionsForUser(userId);
  }

  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = sessionExpiresAt();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      rotatedAt: new Date(),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: getServerEnv().isProduction,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getSessionCookieName())?.value;
  if (rawToken) {
    const tokenHash = hashSessionToken(rawToken);
    await prisma.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    cookieStore.delete(getSessionCookieName());
  }
}

async function findActiveSession(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          company: {
            select: { id: true, name: true, slug: true, onboardedAt: true },
          },
        },
      },
    },
  });

  if (!session) return null;

  if (!sessionTokensMatch(rawToken, session.tokenHash ?? "")) {
    return null;
  }

  return session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(getSessionCookieName())?.value;
  if (!rawToken) return null;

  const session = await findActiveSession(rawToken);
  if (!session || !session.user.active) return null;

  return session.user;
}

export async function requireUser(opts?: {
  permission?: Permission;
}): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (opts?.permission && !can(user.role, opts.permission)) {
    redirect("/dashboard");
  }

  return user;
}

export async function loginWithCredentials(
  email: string,
  password: string,
  opts?: { ip?: string }
) {
  const env = getServerEnv();
  if (env.isProduction || env.redisUrl) {
    const rate = await checkLoginRateLimits({
      email,
      ip: opts?.ip ?? "unknown",
    });
    if (!rate.ok) {
      if (rate.reason === "RATE_LIMITED") {
        return { error: "Invalid email or password" };
      }
      return { error: "Service temporarily unavailable. Please try again later." };
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.active) return { error: "Invalid email or password" };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password" };

  await createSession(user.id, { revokeOthers: true });
  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
  });

  return { user };
}

export async function revokeSessionsOnPasswordChange(userId: string) {
  await revokeAllSessionsForUser(userId);
}

export function isOnboarded(user: AuthUser) {
  return Boolean(user.companyId && user.company?.onboardedAt);
}

/** Seeded demo manager email used by development-only /api/auth/bypass. */
export const DEMO_MANAGER_EMAIL = "manager@hostpitality.app";

/** Development-only bypass — never active in production. */
export function isAuthBypassAllowed() {
  if (process.env.NODE_ENV === "production") return false;
  return getServerEnv().allowAuthBypass;
}

/** Visible indicator for development bypass state. */
export function isAuthBypassActive() {
  return isAuthBypassAllowed();
}
