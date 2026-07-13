import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import { createCompany, createUser } from "./helpers/factories";
import {
  createSessionRecord,
  destroySessionRecord,
  getUserBySessionToken,
  hashPassword,
  loginWithCredentialsForTests,
  revokeSessionsOnPasswordChange,
  sessionCookieOptions,
  verifyPassword,
} from "./helpers/session-test-api";
import {
  generateRawSessionToken,
  getSessionCookieName,
  hashSessionToken,
  sessionTokensMatch,
} from "@/lib/session-crypto";
import { resetServerEnvForTests } from "@/lib/env.server";

const prisma = createTestPrisma();
const created: string[] = [];

afterAll(async () => {
  for (const id of created) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

describe("session lifecycle integration", () => {
  let companyId: string;
  let userId: string;
  let email: string;
  const password = "testpass1234";

  beforeEach(async () => {
    resetServerEnvForTests();
    process.env.SESSION_PEPPER = "test-session-pepper-32chars-min!!";
    const company = await createCompany(prisma);
    created.push(company.id);
    companyId = company.id;
    email = `session-${Date.now()}@test.hostpitality.app`;
    const user = await createUser(prisma, {
      companyId,
      email,
      password,
      role: "OPS_MANAGER",
    });
    userId = user.id;
  });

  it("successful login creates hashed session only", async () => {
    const result = await loginWithCredentialsForTests(prisma, email, password);
    expect(result.error).toBeUndefined();
    expect(result.rawToken).toBeTruthy();

    const sessions = await prisma.session.findMany({ where: { userId } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).toBe(hashSessionToken(result.rawToken!));
    expect(Object.keys(sessions[0])).not.toContain("token");
    // Ensure no column stores the raw token value
    const row = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "Session" WHERE id = $1`,
      sessions[0].id
    );
    expect(JSON.stringify(row[0])).not.toContain(result.rawToken!);
  });

  it("invalid password and unknown email return the same generic error", async () => {
    const badPass = await loginWithCredentialsForTests(prisma, email, "wrong-password");
    const unknown = await loginWithCredentialsForTests(
      prisma,
      "nobody@test.hostpitality.app",
      password
    );
    expect(badPass.error).toBe("Invalid email or password");
    expect(unknown.error).toBe("Invalid email or password");
    expect(badPass.error).toBe(unknown.error);
  });

  it("looks up session from raw cookie token", async () => {
    const { rawToken } = await createSessionRecord(prisma, userId);
    const user = await getUserBySessionToken(prisma, rawToken);
    expect(user?.id).toBe(userId);
    expect(user?.email).toBe(email);
  });

  it("rejects expired sessions", async () => {
    const { session, rawToken } = await createSessionRecord(prisma, userId);
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("rejects revoked sessions", async () => {
    const { session, rawToken } = await createSessionRecord(prisma, userId);
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("logout revokes session and clears cookie binding", async () => {
    const { rawToken, session } = await createSessionRecord(prisma, userId);
    await destroySessionRecord(prisma, rawToken);
    const updated = await prisma.session.findUnique({ where: { id: session.id } });
    expect(updated?.revokedAt).not.toBeNull();
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("new login revokes other concurrent sessions", async () => {
    const first = await createSessionRecord(prisma, userId, { revokeOthers: false });
    const second = await createSessionRecord(prisma, userId, { revokeOthers: true });
    expect(await getUserBySessionToken(prisma, first.rawToken)).toBeNull();
    expect((await getUserBySessionToken(prisma, second.rawToken))?.id).toBe(userId);
    const active = await prisma.session.count({
      where: { userId, revokedAt: null },
    });
    expect(active).toBe(1);
  });

  it("session rotation stores rotatedAt and new hash", async () => {
    const first = await createSessionRecord(prisma, userId);
    const second = await createSessionRecord(prisma, userId, { revokeOthers: true });
    expect(second.session.rotatedAt).toBeTruthy();
    expect(second.tokenHash).not.toBe(first.tokenHash);
  });

  it("password-change revocation invalidates sessions", async () => {
    const { rawToken } = await createSessionRecord(prisma, userId);
    await revokeSessionsOnPasswordChange(prisma, userId);
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("rejects inactive users", async () => {
    await prisma.user.update({ where: { id: userId }, data: { active: false } });
    const result = await loginWithCredentialsForTests(prisma, email, password);
    expect(result.error).toBe("Invalid email or password");

    await prisma.user.update({ where: { id: userId }, data: { active: true } });
    const { rawToken } = await createSessionRecord(prisma, userId);
    await prisma.user.update({ where: { id: userId }, data: { active: false } });
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("production cookie flags are secure httpOnly lax", () => {
    resetServerEnvForTests();
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
    process.env.SESSION_PEPPER = "prod-pepper-32-characters-minimum!";
    process.env.CRON_SECRET = "cron";
    process.env.REDIS_URL = "redis://127.0.0.1:6379";
    process.env.RATE_LIMIT_PEPPER = "rl";
    const opts = sessionCookieOptions(new Date(Date.now() + 86400000));
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(getSessionCookieName()).toBe("__Host-hp_session");
    resetServerEnvForTests();
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  it("development cookie uses non-Host name and secure=false", () => {
    resetServerEnvForTests();
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    const opts = sessionCookieOptions(new Date(Date.now() + 86400000));
    expect(opts.secure).toBe(false);
    expect(getSessionCookieName()).toBe("hp_session");
    resetServerEnvForTests();
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  it("SESSION_PEPPER rotation invalidates existing sessions", async () => {
    process.env.SESSION_PEPPER = "pepper-version-one-32chars-min!!!";
    resetServerEnvForTests();
    const { rawToken, tokenHash } = await createSessionRecord(prisma, userId);
    expect((await getUserBySessionToken(prisma, rawToken))?.id).toBe(userId);

    process.env.SESSION_PEPPER = "pepper-version-two-32chars-min!!!";
    resetServerEnvForTests();
    expect(hashSessionToken(rawToken)).not.toBe(tokenHash);
    expect(await getUserBySessionToken(prisma, rawToken)).toBeNull();
  });

  it("pre-cutover sessions without valid tokenHash cannot authenticate", async () => {
    // Simulate legacy leftover: random hash that doesn't match any raw token
    const orphan = await prisma.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken("legacy-raw-that-was-never-migrated"),
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // cutover revoked
      },
    });
    expect(await getUserBySessionToken(prisma, "legacy-raw-that-was-never-migrated")).toBeNull();
    await prisma.session.delete({ where: { id: orphan.id } });
  });

  it("timing-safe match rejects mismatched tokens", () => {
    const raw = generateRawSessionToken();
    const hash = hashSessionToken(raw);
    expect(sessionTokensMatch(raw, hash)).toBe(true);
    expect(sessionTokensMatch(generateRawSessionToken(), hash)).toBe(false);
  });

  it("password hash verification works for login path", async () => {
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("nope", hash)).toBe(false);
  });
});
