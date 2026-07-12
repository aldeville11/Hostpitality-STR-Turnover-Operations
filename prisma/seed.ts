import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.backgroundJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.turnover.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.property.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.sop.deleteMany();
  await prisma.sow.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const company = await prisma.company.create({
    data: {
      name: "Pacific Stay Ops",
      slug: "pacific-stay-ops",
      timezone: "America/Los_Angeles",
      onboardedAt: new Date(),
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@hostpitality.app",
      name: "Alex Rivera",
      passwordHash,
      role: "OPS_MANAGER",
      companyId: company.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "cleaner@hostpitality.app",
      name: "Jordan Lee",
      passwordHash,
      role: "CLEANER",
      companyId: company.id,
    },
  });

  const property = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Harbor View Loft",
      unitCode: "HVL-101",
      address: "120 Pier Street",
      city: "Santa Barbara",
      state: "CA",
      bedrooms: 2,
      bathrooms: 2,
    },
  });

  await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Jordan Lee",
      email: "jordan.cleaner@pacificstay.ops",
      type: "CLEANER",
      phone: "+1-555-0144",
    },
  });

  await prisma.sop.create({
    data: {
      companyId: company.id,
      name: "Standard Turnover SOP",
      description: "Foundation playbook placeholder",
      contentJson: JSON.stringify([
        { section: "Pre-turnover prep", title: "Gather supplies" },
        { section: "Completion sign-off", title: "Sign off" },
      ]),
    },
  });

  await prisma.sow.create({
    data: {
      companyId: company.id,
      name: "Standard SOW",
      standardScope: "Full clean, linen change, restock, photo proof.",
      slaMinutes: 240,
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: manager.id,
      action: "company.onboarded",
      entityType: "Company",
      entityId: company.id,
      metadata: JSON.stringify({ propertyId: property.id }),
    },
  });

  await prisma.backgroundJob.create({
    data: {
      companyId: company.id,
      type: "turnover.overdue_check",
      status: "PENDING",
      runAt: new Date(),
      payloadJson: "{}",
    },
  });

  console.log("Seeded Hostpitality Phase 1 foundation data");
  console.log("Login: manager@hostpitality.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
