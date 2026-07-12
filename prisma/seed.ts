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

  const propertyA = await prisma.property.create({
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

  const propertyB = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Canyon Cottage",
      unitCode: "CC-12",
      address: "88 Mesa Road",
      city: "Ojai",
      state: "CA",
      bedrooms: 1,
      bathrooms: 1,
      bookingSource: "vrbo",
    },
  });

  const propertyC = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Seaside Studio",
      unitCode: "SS-3",
      address: "14 Ocean Ave",
      city: "Santa Barbara",
      state: "CA",
      bedrooms: 0,
      bathrooms: 1,
      bookingSource: "direct",
    },
  });

  const jordan = await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Jordan Lee",
      email: "jordan.cleaner@pacificstay.ops",
      type: "CLEANER",
      phone: "+1-555-0144",
    },
  });

  const sam = await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Sam Ortiz",
      email: "sam.cleaner@pacificstay.ops",
      type: "CLEANER",
    },
  });

  await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Chris Handyman",
      email: "chris.vendor@pacificstay.ops",
      type: "VENDOR",
    },
  });

  const sop = await prisma.sop.create({
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

  const sow = await prisma.sow.create({
    data: {
      companyId: company.id,
      name: "Standard SOW",
      standardScope: "Full clean, linen change, restock, photo proof.",
      slaMinutes: 240,
    },
  });

  const now = new Date();
  const todayMorning = new Date(now);
  todayMorning.setHours(10, 0, 0, 0);
  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(14, 0, 0, 0);
  const todayEvening = new Date(now);
  todayEvening.setHours(17, 0, 0, 0);

  const bookingA = await prisma.booking.create({
    data: {
      propertyId: propertyA.id,
      externalId: "airbnb-1001",
      guestName: "Guest Party",
      checkIn: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      checkOut: todayMorning,
      source: "airbnb",
    },
  });

  const turnoverToday = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyA.id,
      bookingId: bookingA.id,
      sopId: sop.id,
      sowId: sow.id,
      vendorId: jordan.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      windowStart: todayMorning,
      windowEnd: new Date(todayMorning.getTime() + 4 * 60 * 60 * 1000),
      deadlineAt: new Date(todayMorning.getTime() + 4 * 60 * 60 * 1000),
      photosRequired: 4,
      photosUploaded: 2,
      photosVerified: 1,
      notes: "Pet hair add-on",
    },
  });

  await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyC.id,
      sopId: sop.id,
      sowId: sow.id,
      vendorId: sam.id,
      status: "ASSIGNED",
      priority: "NORMAL",
      windowStart: todayAfternoon,
      windowEnd: new Date(todayAfternoon.getTime() + 3 * 60 * 60 * 1000),
      deadlineAt: new Date(todayAfternoon.getTime() + 3 * 60 * 60 * 1000),
      photosRequired: 3,
      photosUploaded: 0,
      photosVerified: 0,
    },
  });

  await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyB.id,
      sopId: sop.id,
      sowId: sow.id,
      status: "SCHEDULED",
      priority: "URGENT",
      windowStart: todayEvening,
      windowEnd: new Date(todayEvening.getTime() + 3 * 60 * 60 * 1000),
      deadlineAt: new Date(todayEvening.getTime() + 3 * 60 * 60 * 1000),
      photosRequired: 4,
      photosUploaded: 0,
      photosVerified: 0,
      notes: "Unassigned same-day rush",
    },
  });

  const overdueStart = new Date(now.getTime() - 28 * 60 * 60 * 1000);
  const overdueEnd = new Date(now.getTime() - 22 * 60 * 60 * 1000);
  const overdue = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyB.id,
      sopId: sop.id,
      sowId: sow.id,
      vendorId: sam.id,
      status: "OVERDUE",
      priority: "HIGH",
      windowStart: overdueStart,
      windowEnd: overdueEnd,
      deadlineAt: overdueEnd,
      photosRequired: 4,
      photosUploaded: 1,
      photosVerified: 0,
      escalatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  });

  const completedRecent = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyA.id,
      sopId: sop.id,
      sowId: sow.id,
      vendorId: jordan.id,
      status: "COMPLETED",
      priority: "NORMAL",
      windowStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      windowEnd: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      deadlineAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      photosRequired: 4,
      photosUploaded: 4,
      photosVerified: 4,
      ownerNotifiedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    },
  });

  await prisma.issue.createMany({
    data: [
      {
        companyId: company.id,
        turnoverId: turnoverToday.id,
        title: "Hairline crack in bathroom vanity",
        description: "Small crack on left corner of vanity countertop. Not leaking.",
        severity: "MEDIUM",
        status: "OPEN",
        category: "damage",
      },
      {
        companyId: company.id,
        turnoverId: overdue.id,
        title: "Missing hair dryer",
        description: "Bathroom amenity not found during turnover.",
        severity: "HIGH",
        status: "ESCALATED",
        category: "missing",
      },
      {
        companyId: company.id,
        turnoverId: overdue.id,
        title: "Kitchen photo rejected",
        description: "QA failed — framing incomplete, re-shoot required.",
        severity: "LOW",
        status: "IN_PROGRESS",
        category: "qa",
      },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        companyId: company.id,
        propertyId: propertyA.id,
        name: "Toilet paper",
        category: "bathroom",
        quantity: 3,
        reorderLevel: 8,
        unit: "rolls",
      },
      {
        companyId: company.id,
        propertyId: propertyB.id,
        name: "Dishwasher pods",
        category: "kitchen",
        quantity: 2,
        reorderLevel: 6,
        unit: "pods",
      },
      {
        companyId: company.id,
        name: "All-purpose cleaner",
        category: "supplies",
        quantity: 12,
        reorderLevel: 5,
        unit: "bottles",
      },
      {
        companyId: company.id,
        propertyId: propertyA.id,
        name: "Bath towels",
        category: "linen",
        quantity: 10,
        reorderLevel: 6,
        unit: "each",
      },
    ],
  });

  await prisma.notification.create({
    data: {
      companyId: company.id,
      userId: manager.id,
      title: "Owner summary sent",
      body: `Completion summary delivered for ${propertyA.name}.`,
      type: "owner_summary",
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: manager.id,
      action: "onboarding.completed",
      entityType: "Company",
      entityId: company.id,
      metadata: JSON.stringify({
        propertyId: propertyA.id,
        completedTurnoverId: completedRecent.id,
      }),
    },
  });

  console.log("Seeded Hostpitality demo data with dashboard workload");
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
