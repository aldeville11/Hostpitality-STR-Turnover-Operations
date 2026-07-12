import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { can, type Permission } from "./rbac";
import { writeAuditLog } from "./audit";

const SESSION_COOKIE = "hp_session";
const SESSION_DAYS = 14;

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

export async function createSession(userId: string) {
  const token = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { token, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
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

  if (!session || session.expiresAt < new Date() || !session.user.active) {
    return null;
  }

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

export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user || !user.active) return { error: "Invalid email or password" };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password" };

  await createSession(user.id);
  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "auth.login",
    entityType: "User",
    entityId: user.id,
  });

  return { user };
}

export function isOnboarded(user: AuthUser) {
  return Boolean(user.companyId && user.company?.onboardedAt);
}

/** Seeded demo manager email used by temporary /api/auth/bypass. */
export const DEMO_MANAGER_EMAIL = "manager@hostpitality.app";

/** Temporary demo bypass — on in non-production unless AUTH_BYPASS=0. */
export function isAuthBypassAllowed() {
  if (process.env.AUTH_BYPASS === "0") return false;
  if (process.env.AUTH_BYPASS === "1") return true;
  return process.env.NODE_ENV !== "production";
}
