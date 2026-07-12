import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  markStep,
  activateWorkspace,
  getOnboardingContext,
  validateActivation,
} from "../src/lib/onboarding";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const company = await prisma.company.create({
    data: {
      name: "E2E Ops",
      slug: "e2e-ops-" + Date.now().toString(36),
      onboardingStep: "company",
      onboardingProgress: "{}",
      users: {
        create: {
          email: `e2e-${Date.now()}@test.app`,
          name: "E2E",
          passwordHash,
          role: "OPS_MANAGER",
        },
      },
    },
    include: { users: true },
  });
  const userId = company.users[0].id;
  const companyId = company.id;

  await markStep({ companyId, userId, stepId: "company", status: "complete", advance: true });
  await prisma.property.create({
    data: {
      companyId,
      name: "Unit A",
      unitCode: "A1",
      address: "1 Main",
      city: "SB",
      state: "CA",
    },
  });
  await markStep({ companyId, userId, stepId: "properties", status: "complete", advance: true });
  await markStep({ companyId, userId, stepId: "calendars", status: "skipped", advance: true });
  await prisma.sop.create({ data: { companyId, name: "SOP 1", contentJson: "[]" } });
  await markStep({ companyId, userId, stepId: "sops", status: "complete", advance: true });
  await prisma.sow.create({
    data: { companyId, name: "SOW 1", standardScope: "Clean all rooms" },
  });
  await markStep({ companyId, userId, stepId: "sows", status: "complete", advance: true });
  await prisma.vendor.create({
    data: {
      companyId,
      name: "Cleaner 1",
      email: `c-${Date.now()}@test.app`,
      type: "CLEANER",
    },
  });
  await markStep({ companyId, userId, stepId: "vendors", status: "complete", advance: true });
  await markStep({ companyId, userId, stepId: "review", status: "complete", advance: true });

  const ctx = await getOnboardingContext(companyId);
  const errors = validateActivation({
    properties: ctx.counts.properties,
    sops: ctx.counts.sops,
    sows: ctx.counts.sows,
    vendors: ctx.counts.vendors,
    progress: { ...ctx.progress, company: "complete" },
  });
  console.log("validationErrors", errors);

  const result = await activateWorkspace({ companyId, userId, createSampleTurnover: true });
  console.log("activate", result);

  const final = await prisma.company.findUnique({ where: { id: companyId } });
  const turnovers = await prisma.turnover.count({ where: { companyId } });
  console.log({
    onboardedAt: final?.onboardedAt != null,
    turnovers,
    step: final?.onboardingStep,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
