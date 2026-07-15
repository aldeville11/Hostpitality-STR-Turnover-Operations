/**
 * Permanent Tenant Isolation Test Suite — mandatory CI for every future sprint.
 * Spec: Organization A cannot access Organization B resources; AuthContext never
 * leaks foreign tenant data; repository queries require tenant context.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { loadConfig } from "../config.js";
import { createPgliteDb } from "../db/client.js";
import { SESSION_COOKIE_NAME } from "../identity/cookies.js";
import { hashPassword } from "../identity/password.js";
import { newId } from "../identity/tokens.js";
import { SqlPlatformStore, TenantIsolationError } from "../platform/sql-store.js";

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

describe("Tenant Isolation Test Suite", () => {
  let store: SqlPlatformStore;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;
  let orgA: string;
  let orgB: string;
  let locA: string;
  let locB: string;
  let wksA: string;
  let wksB: string;
  let userAId: string;
  let userBId: string;
  let cookieA: string;
  let cookieB: string;

  beforeEach(async () => {
    const db = await createPgliteDb();
    store = new SqlPlatformStore(db);
    const created = await createApp({ config: testConfig(), store, seedDemo: false });
    app = created.app;

    const now = new Date().toISOString();
    const hash = await hashPassword("tenant-a-secret!", 4);
    const hashB = await hashPassword("tenant-b-secret!", 4);

    const userA = await store.createUser({
      id: newId("usr"),
      email: "a@tenant-a.test",
      name: "Tenant A Owner",
      passwordHash: hash,
      status: "active",
      createdAt: now,
      lastSeenAt: null,
    });
    const userB = await store.createUser({
      id: newId("usr"),
      email: "b@tenant-b.test",
      name: "Tenant B Owner",
      passwordHash: hashB,
      status: "active",
      createdAt: now,
      lastSeenAt: null,
    });
    userAId = userA.id;
    userBId = userB.id;

    const organizationA = await store.createOrganization({
      id: newId("org"),
      name: "Org A",
      legalName: "Org A LLC",
      type: "independent",
      billingEntity: null,
      status: "active",
      createdAt: now,
    });
    const organizationB = await store.createOrganization({
      id: newId("org"),
      name: "Org B",
      legalName: "Org B LLC",
      type: "independent",
      billingEntity: null,
      status: "active",
      createdAt: now,
    });
    orgA = organizationA.id;
    orgB = organizationB.id;

    const locationA = await store.createLocation(
      { organizationId: orgA },
      {
        id: newId("loc"),
        organizationId: orgA,
        name: "Loc A",
        timezone: "UTC",
        address: null,
        phone: null,
        gbpLink: null,
        status: "live",
        createdAt: now,
      }
    );
    const locationB = await store.createLocation(
      { organizationId: orgB },
      {
        id: newId("loc"),
        organizationId: orgB,
        name: "Loc B",
        timezone: "UTC",
        address: null,
        phone: null,
        gbpLink: null,
        status: "live",
        createdAt: now,
      }
    );
    locA = locationA.id;
    locB = locationB.id;

    const workspaceA = await store.createWorkspace(
      { organizationId: orgA },
      {
        id: newId("wks"),
        organizationId: orgA,
        name: "Workspace A",
        locationIds: [locA],
        planTier: "standard",
        settings: {},
        status: "active",
        createdAt: now,
      }
    );
    const workspaceB = await store.createWorkspace(
      { organizationId: orgB },
      {
        id: newId("wks"),
        organizationId: orgB,
        name: "Workspace B",
        locationIds: [locB],
        planTier: "standard",
        settings: {},
        status: "active",
        createdAt: now,
      }
    );
    wksA = workspaceA.id;
    wksB = workspaceB.id;

    await store.assignMembership(
      { organizationId: orgA },
      {
        id: newId("mem"),
        userId: userAId,
        workspaceId: wksA,
        organizationId: orgA,
        roleKey: "owner",
        locationScope: [],
        status: "active",
        createdAt: now,
      }
    );
    await store.assignMembership(
      { organizationId: orgB },
      {
        id: newId("mem"),
        userId: userBId,
        workspaceId: wksB,
        organizationId: orgB,
        roleKey: "owner",
        locationScope: [],
        status: "active",
        createdAt: now,
      }
    );

    const loginA = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@tenant-a.test", password: "tenant-a-secret!" }),
    });
    const loginB = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "b@tenant-b.test", password: "tenant-b-secret!" }),
    });
    cookieA = cookieFrom(loginA);
    cookieB = cookieFrom(loginB);
  });

  it("Organization A cannot read Organization B location via API", async () => {
    const res = await app.request(`/api/v1/organizations/${orgA}/locations/${locB}`, {
      headers: { cookie: cookieA },
    });
    expect(res.status).toBe(404);
  });

  it("Organization A cannot read Organization B workspace via API", async () => {
    const res = await app.request(`/api/v1/organizations/${orgA}/workspaces/${wksB}`, {
      headers: { cookie: cookieA },
    });
    expect(res.status).toBe(404);
  });

  it("Membership cannot be assigned across tenants", async () => {
    const res = await app.request(`/api/v1/organizations/${orgA}/memberships`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({
        userId: userBId,
        workspaceId: wksB,
        roleKey: "csr",
      }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("TENANT_ISOLATION");
  });

  it("Actor with org A membership cannot use org B path even if IDs guessed", async () => {
    const res = await app.request(`/api/v1/organizations/${orgB}/locations`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify({ name: "Evil", timezone: "UTC" }),
    });
    expect(res.status).toBe(403);
  });

  it("Authentication /me never exposes foreign tenant data", async () => {
    const meA = await (await app.request("/api/v1/auth/me", { headers: { cookie: cookieA } })).json();
    const meB = await (await app.request("/api/v1/auth/me", { headers: { cookie: cookieB } })).json();
    expect(meA.authContext.organizationId).toBe(orgA);
    expect(meA.authContext.workspaceId).toBe(wksA);
    expect(meB.authContext.organizationId).toBe(orgB);
    expect(meB.authContext.workspaceId).toBe(wksB);
    expect(meA.authContext.organizationId).not.toBe(meB.authContext.organizationId);
  });

  it("Repository getLocation without matching tenant context returns null", async () => {
    const found = await store.getLocation({ organizationId: orgA }, locB);
    expect(found).toBeNull();
  });

  it("Repository createLocation rejects mismatched organizationId vs tenant", async () => {
    await expect(
      store.createLocation(
        { organizationId: orgA },
        {
          id: newId("loc"),
          organizationId: orgB,
          name: "X",
          timezone: "UTC",
          address: null,
          phone: null,
          gbpLink: null,
          status: "setup",
          createdAt: new Date().toISOString(),
        }
      )
    ).rejects.toBeInstanceOf(TenantIsolationError);
  });

  it("Repository assignMembership cannot attach workspace of another org", async () => {
    await expect(
      store.assignMembership(
        { organizationId: orgA },
        {
          id: newId("mem"),
          userId: userAId,
          workspaceId: wksB,
          organizationId: orgA,
          roleKey: "owner",
          locationScope: [],
          status: "active",
          createdAt: new Date().toISOString(),
        }
      )
    ).rejects.toBeInstanceOf(TenantIsolationError);
  });

  it("listMemberships is scoped to tenant organization only", async () => {
    const listA = await store.listMemberships({ organizationId: orgA });
    const listB = await store.listMemberships({ organizationId: orgB });
    expect(listA.every((m) => m.organizationId === orgA)).toBe(true);
    expect(listB.every((m) => m.organizationId === orgB)).toBe(true);
    expect(listA.some((m) => m.organizationId === orgB)).toBe(false);
  });
});
