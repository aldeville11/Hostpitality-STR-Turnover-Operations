import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  DEMO_MANAGER_EMAIL,
  getCurrentUser,
  isAuthBypassAllowed,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { log } from "@/lib/logger";

const SESSION_COOKIE = "hp_session";
const SESSION_DAYS = 14;

/**
 * Temporary auto-login for the seeded demo manager.
 * GET /api/auth/bypass → sets session cookie and redirects to /dashboard (or ?next=).
 * Example: /api/auth/bypass?next=/launch
 */
export async function GET(request: Request) {
  if (!isAuthBypassAllowed()) {
    return NextResponse.json(
      { error: "Auth bypass is disabled. Set AUTH_BYPASS=1 to enable." },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next") || "/dashboard";
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  const existing = await getCurrentUser();
  if (existing?.email === DEMO_MANAGER_EMAIL) {
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  const user = await prisma.user.findUnique({
    where: { email: DEMO_MANAGER_EMAIL },
  });

  if (!user || !user.active) {
    return NextResponse.json(
      {
        error: `Demo user ${DEMO_MANAGER_EMAIL} not found. Run npm run db:setup.`,
      },
      { status: 404 }
    );
  }

  const token = nanoid(48);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.session.create({
    data: { token, userId: user.id, expiresAt },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "auth.bypass_login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: DEMO_MANAGER_EMAIL, temporary: true },
  });
  log.warn("auth.bypass_login", { email: DEMO_MANAGER_EMAIL, userId: user.id });

  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
