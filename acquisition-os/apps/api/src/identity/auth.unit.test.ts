import { describe, expect, it } from "vitest";
import {
  buildSessionCookie,
  clearSessionCookie,
  readCookie,
  SESSION_COOKIE_NAME,
} from "./cookies.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  assertPermission,
  CONSTITUTION_ROLE_KEYS,
  isAuthenticated,
  RbacNotReadyError,
  toAuthContext,
} from "./rbac.js";
import { generateSessionToken, hashSessionToken } from "./tokens.js";

describe("password", () => {
  it("hashes and verifies with bcrypt", async () => {
    const hash = await hashPassword("secret-value", 4);
    expect(hash).not.toContain("secret-value");
    expect(await verifyPassword("secret-value", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("hashes with HMAC-SHA-256 pepper (ADR 0002)", () => {
    const token = generateSessionToken();
    const a = hashSessionToken(token, "pepper-a");
    const b = hashSessionToken(token, "pepper-b");
    expect(a).toHaveLength(64);
    expect(a).not.toBe(token);
    expect(a).not.toBe(b);
  });
});

describe("cookies", () => {
  it("builds aos_session with HttpOnly SameSite=Lax", () => {
    const cookie = buildSessionCookie("tok123", { secure: true, maxAgeSeconds: 3600 });
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=tok123`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Max-Age=3600");
  });

  it("omits Secure outside production flags", () => {
    const cookie = buildSessionCookie("tok", { secure: false, maxAgeSeconds: 1 });
    expect(cookie).not.toContain("Secure");
  });

  it("clears cookie and reads from header", () => {
    const cleared = clearSessionCookie(false);
    expect(cleared).toContain("Max-Age=0");
    expect(readCookie(`${SESSION_COOKIE_NAME}=abc; other=1`, SESSION_COOKIE_NAME)).toBe("abc");
    expect(readCookie(undefined, SESSION_COOKIE_NAME)).toBeNull();
  });
});

describe("rbac hooks", () => {
  it("exposes Constitution role vocabulary", () => {
    expect(CONSTITUTION_ROLE_KEYS).toContain("owner");
    expect(CONSTITUTION_ROLE_KEYS).toContain("administrator");
  });

  it("builds AuthContext with membership tenancy when provided", () => {
    const ctx = toAuthContext({
      userId: "usr_1",
      email: "a@b.c",
      status: "active",
      sessionId: "ses_1",
      organizationId: "org_1",
      workspaceId: "wks_1",
      role: "owner",
      locationScope: ["loc_1"],
    });
    expect(ctx.organizationId).toBe("org_1");
    expect(ctx.workspaceId).toBe("wks_1");
    expect(ctx.role).toBe("owner");
    expect(ctx.locationScope).toEqual(["loc_1"]);
    expect(isAuthenticated(ctx)).toBe(true);
  });

  it("builds AuthContext with null tenancy when membership absent", () => {
    const ctx = toAuthContext({
      userId: "usr_1",
      email: "a@b.c",
      status: "active",
      sessionId: "ses_1",
    });
    expect(ctx.organizationId).toBeNull();
    expect(ctx.workspaceId).toBeNull();
    expect(ctx.role).toBeNull();
    expect(ctx.locationScope).toEqual([]);
  });

  it("assertPermission fails closed until Sprint 3", () => {
    const ctx = toAuthContext({
      userId: "usr_1",
      email: "a@b.c",
      status: "active",
      sessionId: "ses_1",
    });
    expect(() => assertPermission(ctx, "users.invite")).toThrow(RbacNotReadyError);
  });
});
