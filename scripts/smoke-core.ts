/**
 * Core smoke tests for Hostpitality launch hardening.
 * Usage: npm run smoke
 */
import { PrismaClient } from "@prisma/client";
import { runSmokeTests } from "../src/lib/launch";

const prisma = new PrismaClient();

async function main() {
  const company =
    (await prisma.company.findFirst({
      where: { slug: "pacific-stay" },
      select: { id: true, name: true, slug: true },
    })) ??
    (await prisma.company.findFirst({
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
    }));

  if (!company) {
    console.error("No company found. Run npm run db:setup first.");
    process.exit(1);
  }

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
