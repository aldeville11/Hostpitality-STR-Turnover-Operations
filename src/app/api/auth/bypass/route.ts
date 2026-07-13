import { NextResponse } from "next/server";
import {
  DEMO_MANAGER_EMAIL,
  getCurrentUser,
  isAuthBypassAllowed,
  createSession,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { log } from "@/lib/logger";

function redirectPreservingHost(request: Request, path: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: path.startsWith("/") ? path : `/${path}` },
  });
}

/**
 * Development-only auto-login for the seeded demo manager.
 * Requires ALLOW_AUTH_BYPASS=true and NODE_ENV !== production.
 */
export async function GET(request: Request) {
  if (!isAuthBypassAllowed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  }

  await createSession(user.id, { revokeOthers: true });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "auth.bypass_login",
    entityType: "User",
    entityId: user.id,
    metadata: { email: DEMO_MANAGER_EMAIL, developmentOnly: true },
  });
  log.warn("auth.bypass_login", { email: DEMO_MANAGER_EMAIL, userId: user.id });

  return redirectPreservingHost(request, safeNext);
}
