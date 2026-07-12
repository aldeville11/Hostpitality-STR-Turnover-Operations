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

  const progress = {
    company: "complete",
    properties: "complete",
    calendars: "complete",
    sops: "complete",
    sows: "complete",
    vendors: "complete",
    review: "complete",
    finish: "complete",
  };

  const company = await prisma.company.create({
    data: {
      name: "Pacific Stay Ops",
      slug: "pacific-stay-ops",
      timezone: "America/Los_Angeles",
      onboardedAt: new Date(),
      onboardingStep: "finish",
      onboardingProgress: JSON.stringify(progress),
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
      calendarUrl: "https://calendar.example.com/hvl-101.ics",
      bookingSource: "airbnb",
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
      description: "Foundation playbook",
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
      action: "onboarding.completed",
      entityType: "Company",
      entityId: company.id,
      metadata: JSON.stringify({ propertyId: property.id }),
    },
  });

  console.log("Seeded Hostpitality demo data (onboarded workspace)");
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
