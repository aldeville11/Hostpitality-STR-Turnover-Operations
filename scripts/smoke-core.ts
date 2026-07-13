/**
 * Core smoke tests for Hostpitality launch hardening.
 * Usage: npm run smoke
 */
import { PrismaClient } from "@prisma/client";
import { runSmokeTests } from "../src/lib/launch";

const prisma = new PrismaClient();

async function ensureSmokeCompany() {
  const candidates = await prisma.company.findMany({
    where: { onboardedAt: { not: null } },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  for (const candidate of candidates) {
    const [properties, sops, sows] = await Promise.all([
      prisma.property.count({ where: { companyId: candidate.id, active: true } }),
      prisma.sop.count({ where: { companyId: candidate.id, active: true } }),
      prisma.sow.count({ where: { companyId: candidate.id, active: true } }),
    ]);
    if (properties >= 1 && sops >= 1 && sows >= 1) return candidate;
  }

  const slug = `smoke-${Date.now().toString(36)}`;
  const company = await prisma.company.create({
    data: {
      name: "Smoke Test Co",
      slug,
      onboardedAt: new Date(),
      onboardingStep: "finish",
      onboardingProgress: JSON.stringify({ finish: "complete" }),
    },
  });

  await prisma.sop.create({
    data: { companyId: company.id, name: "Smoke SOP", status: "PUBLISHED", publishedAt: new Date() },
  });
  await prisma.sow.create({
    data: { companyId: company.id, name: "Smoke SOW", status: "ACTIVE", approvedAt: new Date() },
  });
  const property = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Smoke Property",
      unitCode: "SMK-01",
      address: "1 Smoke St",
      city: "Test",
      state: "CA",
    },
  });

  const now = new Date();
  await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: property.id,
      status: "SCHEDULED",
      windowStart: now,
      windowEnd: new Date(now.getTime() + 3600000),
      deadlineAt: new Date(now.getTime() + 7200000),
    },
  });

  return { id: company.id, name: company.name, slug: company.slug };
}

async function main() {
  const company = await ensureSmokeCompany();

  console.log(`Running smoke tests for ${company.name} (${company.slug})…`);
  const results = await runSmokeTests(company.id);
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "PASS" : "FAIL";
    console.log(`${mark}  ${r.name} (${r.ms}ms) — ${r.detail}`);
    if (!r.ok) failed += 1;
  }
  console.log(
    failed === 0
      ? `\nAll ${results.length} smoke tests passed.`
      : `\n${failed}/${results.length} smoke tests failed.`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
