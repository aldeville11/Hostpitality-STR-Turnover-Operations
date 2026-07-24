import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { SESSION_COOKIE_NAME } from "./cookies.js";
import { MemoryIdentityStore } from "./store.js";

function testConfig() {
  return loadConfig({
    NODE_ENV: "test",
    SESSION_PEPPER: "test-session-pepper-not-for-production",
    BCRYPT_COST: "4",
    CORS_ORIGIN: "http://localhost:5173",
    API_PORT: "3001",
  });
}

function getSetCookie(res: Response): string {
  // undici / fetch may expose getSetCookie
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie().join("; ");
  }
  return res.headers.get("set-cookie") ?? "";
}

function sessionCookieFrom(res: Response): string {
  const raw = getSetCookie(res);
  const match = raw.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Error(`No ${SESSION_COOKIE_NAME} in ${raw}`);
  return `${SESSION_COOKIE_NAME}=${match[1]}`;
}

describe("auth integration", () => {
  it("login → me → logout round-trip", async () => {
    const store = new MemoryIdentityStore();
    const { app } = await createApp({
      config: testConfig(),
      store,
      seedDemo: true,
    });

    const login = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "demo@acquisition-os.local",
        password: "ChangeMe-Demo-Only-1!",
      }),
    });
    expect(login.status).toBe(200);
    const loginBody = await login.json();
    expect(loginBody.user.email).toBe("demo@acquisition-os.local");
    expect(loginBody.authContext.organizationId).toBeNull();

    const cookie = sessionCookieFrom(login);

    const me = await app.request("/api/v1/auth/me", {
      headers: { cookie },
    });
    expect(me.status).toBe(200);
    const meBody = await me.json();
    expect(meBody.user.id).toBe(loginBody.user.id);

    const logout = await app.request("/api/v1/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    expect(logout.status).toBe(200);
    expect(getSetCookie(logout)).toContain("Max-Age=0");

    const meAfter = await app.request("/api/v1/auth/me", {
      headers: { cookie },
    });
    expect(meAfter.status).toBe(401);
  });

  it("rejects bad password", async () => {
    const { app } = await createApp({ config: testConfig(), store: new MemoryIdentityStore() });
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "demo@acquisition-os.local",
        password: "wrong-password",
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("invite stub creates invited user without tenancy", async () => {
    const { app } = await createApp({ config: testConfig(), store: new MemoryIdentityStore() });

    const login = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "demo@acquisition-os.local",
        password: "ChangeMe-Demo-Only-1!",
      }),
    });
    const cookie = sessionCookieFrom(login);

    const invite = await app.request("/api/v1/auth/invites", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ email: "new.ops@example.com", name: "New Ops" }),
    });
    expect(invite.status).toBe(201);
    const body = await invite.json();
    expect(body.invite.email).toBe("new.ops@example.com");
    expect(body.invite.userStatus).toBe("invited");
    expect(body.invite.status).toBe("pending");
  });

  it("rbac probe returns not ready (Sprint 3 hook)", async () => {
    const { app } = await createApp({ config: testConfig(), store: new MemoryIdentityStore() });
    const login = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "demo@acquisition-os.local",
        password: "ChangeMe-Demo-Only-1!",
      }),
    });
    const cookie = sessionCookieFrom(login);
    const probe = await app.request("/api/v1/auth/rbac/probe", { headers: { cookie } });
    expect(probe.status).toBe(501);
    const body = await probe.json();
    expect(body.ready).toBe(false);
    expect(body.code).toBe("RBAC_NOT_READY");
  });
});
