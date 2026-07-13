import { describe, it, expect, afterAll, vi, beforeEach } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import {
  createCompany,
  createCompanyFixtures,
  createProperty,
  createUser,
  createSop,
  createSow,
} from "./helpers/factories";
import { linkPropertiesToSop } from "@/lib/sops";
import { linkPropertiesToSow } from "@/lib/sows";
import { parseAccessScope } from "@/lib/access-scope";
import { TenantAccessError } from "@/lib/tenant";
import type { AuthUser } from "@/lib/auth";

const prisma = createTestPrisma();
const companyIds: string[] = [];

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

afterAll(async () => {
  for (const id of companyIds) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

function asAuthUser(user: {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  role: string;
  accessScopeJson?: string | null;
}): AuthUser {
  return {
    ...(user as AuthUser),
    accessScope: parseAccessScope(user.accessScopeJson),
    company: user.companyId
      ? { id: user.companyId, name: "Co", slug: "co", onboardedAt: new Date() }
      : null,
  };
}

beforeEach(() => requireUserMock.mockReset());

describe("SOP/SOW property linking accessScope", () => {
  it("company-wide linking and restricted linking behave correctly", async () => {
    const company = await createCompany(prisma, { name: "LinkCo" });
    companyIds.push(company.id);
    const a = await createProperty(prisma, company.id);
    const b = await createProperty(prisma, company.id);
    const other = await createCompany(prisma, { name: "Other" });
    companyIds.push(other.id);
    const foreign = await createProperty(prisma, other.id);
    const user = await createUser(prisma, {
      companyId: company.id,
      accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
    });

    const sop = await createSop(prisma, company.id);
    const sow = await createSow(prisma, company.id);

    const wide = parseAccessScope(JSON.stringify({ allProperties: true, propertyIds: [] }));
    await linkPropertiesToSop({
      companyId: company.id,
      sopId: sop.id,
      propertyIds: [a.id, b.id],
      userId: user.id,
      accessScope: wide,
    });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: a.id } })).sopId).toBe(sop.id);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: b.id } })).sopId).toBe(sop.id);

    const restricted = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: [a.id] })
    );
    await linkPropertiesToSop({
      companyId: company.id,
      sopId: sop.id,
      propertyIds: [a.id],
      userId: user.id,
      accessScope: restricted,
    });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: b.id } })).sopId).toBe(sop.id);

    await expect(
      linkPropertiesToSop({
        companyId: company.id,
        sopId: sop.id,
        propertyIds: [a.id, b.id],
        userId: user.id,
        accessScope: restricted,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);

    await expect(
      linkPropertiesToSop({
        companyId: company.id,
        sopId: sop.id,
        propertyIds: [foreign.id],
        userId: user.id,
        accessScope: wide,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);

    const empty = parseAccessScope(JSON.stringify({ allProperties: false, propertyIds: [] }));
    await expect(
      linkPropertiesToSop({
        companyId: company.id,
        sopId: sop.id,
        propertyIds: [a.id],
        userId: user.id,
        accessScope: empty,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);

    const malformed = parseAccessScope("{not-json");
    await expect(
      linkPropertiesToSow({
        companyId: company.id,
        sowId: sow.id,
        propertyIds: [a.id],
        userId: user.id,
        accessScope: malformed,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);

    await linkPropertiesToSow({
      companyId: company.id,
      sowId: sow.id,
      propertyIds: [a.id],
      userId: user.id,
      accessScope: restricted,
    });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: a.id } })).sowId).toBe(sow.id);

    await linkPropertiesToSow({
      companyId: company.id,
      sowId: sow.id,
      propertyIds: [],
      userId: user.id,
      accessScope: restricted,
    });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: a.id } })).sowId).toBeNull();
  });

  it("linkSopPropertiesAction and linkSowPropertiesAction reject out-of-scope lists atomically", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const a = fx.property;
    const b = await createProperty(prisma, fx.company.id);
    const restrictedUser = await createUser(prisma, {
      companyId: fx.company.id,
      email: `r-${Date.now()}@example.com`,
      accessScopeJson: JSON.stringify({ allProperties: false, propertyIds: [a.id] }),
    });
    requireUserMock.mockResolvedValue(asAuthUser(restrictedUser));

    const sop = await createSop(prisma, fx.company.id);
    const sow = await createSow(prisma, fx.company.id);

    const { linkSopPropertiesAction } = await import("@/lib/sop-actions");
    const { linkSowPropertiesAction } = await import("@/lib/sow-actions");

    const fd = new FormData();
    fd.set("sopId", sop.id);
    fd.append("propertyIds", a.id);
    fd.append("propertyIds", b.id);
    const sopResult = await linkSopPropertiesAction(fd);
    expect(sopResult).toMatchObject({ error: expect.any(String) });
    expect((await prisma.property.findUniqueOrThrow({ where: { id: a.id } })).sopId).not.toBe(sop.id);
    expect((await prisma.property.findUniqueOrThrow({ where: { id: b.id } })).sopId).not.toBe(sop.id);

    const fd2 = new FormData();
    fd2.set("sowId", sow.id);
    fd2.append("propertyIds", b.id);
    const sowResult = await linkSowPropertiesAction(fd2);
    expect(sowResult).toMatchObject({ error: expect.any(String) });
  });
});
