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

/** Build an absolute URL that respects Cursor port-forward / proxy Host headers. */
function absoluteFromRequest(request: Request, path: string) {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "") ??
    "http";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  return `${proto}://${host}${path.startsWith("/") ? path : `/${path}`}`;
}

function redirectPreservingHost(request: Request, path: string) {
  // Prefer a relative Location when possible via raw Response so browsers keep
  // whatever host Cursor port-forward / preview used (not hardcoded localhost).
  const response = new NextResponse(null, {
    status: 307,
    headers: { Location: path.startsWith("/") ? path : `/${path}` },
  });
  // Also set an absolute fallback target for clients that require it.
  response.headers.set("X-Redirect-Absolute", absoluteFromRequest(request, path));
  return response;
}

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
    return redirectPreservingHost(request, safeNext);
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

  const response = redirectPreservingHost(request, safeNext);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
