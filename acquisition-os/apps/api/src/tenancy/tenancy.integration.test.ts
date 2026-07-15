import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createPgliteDb } from "../db/client.js";
import { SESSION_COOKIE_NAME } from "../identity/cookies.js";
import { SqlPlatformStore } from "../platform/sql-store.js";
import { DOMAIN_EVENT } from "./service.js";

function testConfig() {
  return loadConfig({
    NODE_ENV: "test",
    SESSION_PEPPER: "test-session-pepper-not-for-production",
    BCRYPT_COST: "4",
    CORS_ORIGIN: "http://localhost:5173",
  });
}

function cookieFrom(res: Response): string {
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
  const raw =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie().join("; ")
      : (res.headers.get("set-cookie") ?? "");
  const match = raw.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Error("missing session cookie");
  return `${SESSION_COOKIE_NAME}=${match[1]}`;
}

async function loginDemo(app: { request: typeof Request.prototype }) {
  const login = await (app as { request: (url: string, init?: RequestInit) => Promise<Response> }).request(
    "/api/v1/auth/login",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "demo@acquisition-os.local",
        password: "ChangeMe-Demo-Only-1!",
      }),
    }
  );
  expect(login.status).toBe(200);
  return { cookie: cookieFrom(login), body: await login.json() };
}

describe("tenancy CRUD integration", () => {
  let store: SqlPlatformStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;

  beforeEach(async () => {
    const db = await createPgliteDb();
    store = new SqlPlatformStore(db);
    const created = await createApp({ config: testConfig(), store, seedDemo: true });
    app = created.app;
  });

  it("creates organization → location → workspace → membership (AC)", async () => {
    const { cookie, body: loginBody } = await loginDemo(app);

    const orgRes = await app.request("/api/v1/organizations", {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Acme Ops",
        legalName: "Acme Operations LLC",
        type: "multi_location",
      }),
    });
    expect(orgRes.status).toBe(201);
    const { organization } = await orgRes.json();

    const locRes = await app.request(`/api/v1/organizations/${organization.id}/locations`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name: "Downtown", timezone: "America/New_York" }),
    });
    expect(locRes.status).toBe(201);
    const { location } = await locRes.json();

    const wksRes = await app.request(`/api/v1/organizations/${organization.id}/workspaces`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        name: "Acme Command Center",
        locationIds: [location.id],
      }),
    });
    expect(wksRes.status).toBe(201);
    const { workspace } = await wksRes.json();
    expect(workspace.locationIds).toEqual([location.id]);

    const memRes = await app.request(`/api/v1/organizations/${organization.id}/memberships`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        userId: loginBody.user.id,
        workspaceId: workspace.id,
        roleKey: "owner",
        locationScope: [],
      }),
    });
    expect(memRes.status).toBe(201);
    const { membership } = await memRes.json();
    expect(membership.roleKey).toBe("owner");

    const events = await store.listDomainEvents({ organizationId: organization.id });
    const types = events.map((e) => e.type);
    expect(types).toContain(DOMAIN_EVENT.ORGANIZATION_CREATED);
    expect(types).toContain(DOMAIN_EVENT.LOCATION_CREATED);
    expect(types).toContain(DOMAIN_EVENT.WORKSPACE_CREATED);
    expect(types).toContain(DOMAIN_EVENT.MEMBERSHIP_ASSIGNED);

    const me = await app.request("/api/v1/auth/me", { headers: { cookie } });
    const meBody = await me.json();
    expect(meBody.authContext.organizationId).toBe(organization.id);
    expect(meBody.authContext.workspaceId).toBe(workspace.id);
    expect(meBody.authContext.role).toBe("owner");
  });
});
