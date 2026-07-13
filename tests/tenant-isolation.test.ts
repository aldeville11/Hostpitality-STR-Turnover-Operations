import { describe, it, expect, afterAll } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import { createCompanyFixtures } from "./helpers/factories";
import { createIssue } from "@/lib/issues";
import { TenantAccessError } from "@/lib/tenant";

describe("tenant isolation", () => {
  const prisma = createTestPrisma();
  const createdCompanyIds: string[] = [];

  afterAll(async () => {
    for (const id of createdCompanyIds) {
      await prisma.company.delete({ where: { id } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it("rejects foreign property on issue create", async () => {
    const a = await createCompanyFixtures(prisma, "A");
    const b = await createCompanyFixtures(prisma, "B");
    createdCompanyIds.push(a.company.id, b.company.id);

    await expect(
      createIssue({
        companyId: a.company.id,
        userId: a.user.id,
        title: "Cross-tenant",
        description: "Should fail",
        propertyId: b.property.id,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);
  });

  it("rejects foreign turnover on issue create", async () => {
    const a = await createCompanyFixtures(prisma, "A");
    const b = await createCompanyFixtures(prisma, "B");
    createdCompanyIds.push(a.company.id, b.company.id);

    await expect(
      createIssue({
        companyId: a.company.id,
        userId: a.user.id,
        title: "Cross-tenant turnover",
        description: "Should fail",
        turnoverId: b.turnover.id,
      })
    ).rejects.toBeInstanceOf(TenantAccessError);
  });
});
