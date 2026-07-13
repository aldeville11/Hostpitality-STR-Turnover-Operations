import { describe, it, expect, afterAll } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import { createCompanyFixtures, createProperty } from "./helpers/factories";
import { listProperties, getPropertyDetail } from "@/lib/properties";
import { listTurnovers, getTurnoverDetail } from "@/lib/turnovers";
import { listIssues } from "@/lib/issues";
import { parseAccessScope, sanitizeAccessScopeForCompany } from "@/lib/access-scope";
import { TenantAccessError } from "@/lib/tenant";

const prisma = createTestPrisma();
const companyIds: string[] = [];

afterAll(async () => {
  for (const id of companyIds) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

describe("accessScope enforcement", () => {
  it("parses malformed scope fail-closed", () => {
    expect(parseAccessScope("{not-json")).toEqual({ allProperties: false, propertyIds: [] });
    expect(parseAccessScope('{"allProperties":false}')).toEqual({
      allProperties: false,
      propertyIds: [],
    });
  });

  it("restricts property list and detail within same company", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    const other = await createProperty(prisma, fixtures.company.id);

    const scope = { allProperties: false, propertyIds: [fixtures.property.id] };
    const listed = await listProperties(fixtures.company.id, scope);
    expect(listed.map((p) => p.id)).toEqual([fixtures.property.id]);

    expect(await getPropertyDetail(fixtures.company.id, other.id, scope)).toBeNull();
    expect(
      (await getPropertyDetail(fixtures.company.id, fixtures.property.id, scope))?.property.id
    ).toBe(fixtures.property.id);
  });

  it("restricts turnovers and issues by property scope", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    const otherProp = await createProperty(prisma, fixtures.company.id);
    const now = new Date();
    const otherTurnover = await prisma.turnover.create({
      data: {
        companyId: fixtures.company.id,
        propertyId: otherProp.id,
        status: "SCHEDULED",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    await prisma.issue.create({
      data: {
        companyId: fixtures.company.id,
        propertyId: otherProp.id,
        title: "Out of scope",
        description: "hidden",
      },
    });

    const scope = { allProperties: false, propertyIds: [fixtures.property.id] };
    const turnovers = await listTurnovers(fixtures.company.id, {}, scope);
    expect(turnovers.every((t) => t.propertyId === fixtures.property.id)).toBe(true);
    expect(await getTurnoverDetail(fixtures.company.id, otherTurnover.id, scope)).toBeNull();

    const issues = await listIssues(fixtures.company.id, {}, scope);
    expect(issues.every((i) => i.propertyId === fixtures.property.id)).toBe(true);
  });

  it("rejects foreign property IDs when saving accessScope", async () => {
    const a = await createCompanyFixtures(prisma, "A");
    const b = await createCompanyFixtures(prisma, "B");
    companyIds.push(a.company.id, b.company.id);

    await expect(
      sanitizeAccessScopeForCompany(a.company.id, {
        allProperties: false,
        propertyIds: [b.property.id],
      })
    ).rejects.toBeInstanceOf(TenantAccessError);
  });

  it("company-wide scope sees all properties", async () => {
    const fixtures = await createCompanyFixtures(prisma, "A");
    companyIds.push(fixtures.company.id);
    await createProperty(prisma, fixtures.company.id);
    const listed = await listProperties(fixtures.company.id, {
      allProperties: true,
      propertyIds: [],
    });
    expect(listed.length).toBeGreaterThanOrEqual(2);
  });
});
