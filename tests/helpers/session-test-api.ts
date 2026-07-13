import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  generateRawSessionToken,
  hashSessionToken,
  sessionExpiresAt,
  sessionTokensMatch,
  SESSION_DAYS,
  getSessionCookieName,
} from "@/lib/session-crypto";
import { parseAccessScope } from "@/lib/access-scope";
import { getServerEnv } from "@/lib/env.server";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionRecord(
  prisma: PrismaClient,
  userId: string,
  opts?: { revokeOthers?: boolean }
) {
  if (opts?.revokeOthers ?? true) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = sessionExpiresAt();
  const session = await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      rotatedAt: new Date(),
    },
  });
  return { session, rawToken, expiresAt, tokenHash };
}

export async function destroySessionRecord(prisma: PrismaClient, rawToken: string) {
  const tokenHash = hashSessionToken(rawToken);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserBySessionToken(prisma: PrismaClient, rawToken: string) {
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
  if (!session || !session.user.active) return null;
  if (!sessionTokensMatch(rawToken, session.tokenHash)) return null;
  return {
    ...session.user,
    accessScope: parseAccessScope(session.user.accessScopeJson),
  };
}

export async function loginWithCredentialsForTests(
  prisma: PrismaClient,
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.active) return { error: "Invalid email or password" as const };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password" as const };

  const { rawToken } = await createSessionRecord(prisma, user.id, { revokeOthers: true });
  return { user, rawToken };
}

export async function revokeSessionsOnPasswordChange(prisma: PrismaClient, userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: getServerEnv().isProduction,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    expires: expiresAt,
    name: getSessionCookieName(),
  };
}
