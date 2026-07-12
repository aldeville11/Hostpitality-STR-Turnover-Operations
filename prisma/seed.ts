import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const Role = {
  OPS_MANAGER: "OPS_MANAGER",
  CLEANER: "CLEANER",
  CLEANING_COORDINATOR: "CLEANING_COORDINATOR",
  VENDOR: "VENDOR",
} as const;

async function main() {
  await prisma.backgroundJob.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.agentAction.deleteMany();
  await prisma.ownerReport.deleteMany();
  await prisma.photoSubmission.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.cleanerAssignment.deleteMany();
  await prisma.turnover.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.property.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.sopStep.deleteMany();
  await prisma.sop.deleteMany();
  await prisma.sowTemplate.deleteMany();
  await prisma.teamMember.deleteMany();
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
      role: Role.OPS_MANAGER,
      companyId: company.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "cleaner@hostpitality.app",
      name: "Jordan Lee",
      passwordHash,
      role: Role.CLEANER,
      companyId: company.id,
    },
  });

  const coordinator = await prisma.user.create({
    data: {
      email: "coord@hostpitality.app",
      name: "Sam Chen",
      passwordHash,
      role: Role.CLEANING_COORDINATOR,
      companyId: company.id,
    },
  });

  const owner = await prisma.owner.create({
    data: {
      companyId: company.id,
      name: "Maya Thompson",
      email: "maya@example.com",
      phone: "+1-555-0101",
    },
  });

  const sop = await prisma.sop.create({
    data: {
      companyId: company.id,
      name: "Standard 2BR Coastal Turnover",
      description: "Full playbook for 2-bedroom coastal short-term rentals.",
      deepCleanEveryN: 4,
      steps: {
        create: [
          {
            section: "Pre-turnover prep",
            title: "Confirm checkout & gather supplies",
            instructions: "Verify guest checkout, load caddy with linens, towels, amenities, and PPE.",
            sortOrder: 1,
          },
          {
            section: "Pre-turnover prep",
            title: "Safety and supply check",
            instructions: "Check extinguisher, CO/smoke detectors, and restock kit levels before entry.",
            sortOrder: 2,
          },
          {
            section: "Room-by-room",
            title: "Kitchen deep wipe",
            instructions: "Clean counters, sink, appliances, empty trash, restock dishwasher pods.",
            requiresPhoto: true,
            photoLabel: "Kitchen after clean",
            sortOrder: 3,
          },
          {
            section: "Room-by-room",
            title: "Bathrooms sanitize",
            instructions: "Scrub tub/shower, toilet, vanity; replace towels and toiletries.",
            requiresPhoto: true,
            photoLabel: "Bathroom after clean",
            sortOrder: 4,
          },
          {
            section: "Room-by-room",
            title: "Bedrooms reset",
            instructions: "Strip and remake beds with fresh linens; vacuum floors and under beds.",
            requiresPhoto: true,
            photoLabel: "Bedroom staged",
            sortOrder: 5,
          },
          {
            section: "Room-by-room",
            title: "Living area & floors",
            instructions: "Dust surfaces, fluff cushions, vacuum/mop all floors.",
            sortOrder: 6,
          },
          {
            section: "Restock verification",
            title: "Verify consumables",
            instructions: "Confirm TP, paper towels, coffee, trash bags, and toiletries meet par levels.",
            sortOrder: 7,
          },
          {
            section: "Photo documentation",
            title: "Capture required photos",
            instructions: "Shoot all required proof photos with good lighting and full-room framing.",
            requiresPhoto: true,
            photoLabel: "Final living room",
            sortOrder: 8,
          },
          {
            section: "Final walkthrough",
            title: "Walkthrough & lockup",
            instructions: "Run final walkthrough checklist, set thermostat, lock all doors.",
            sortOrder: 9,
          },
          {
            section: "Deep-clean cadence",
            title: "Deep clean extras",
            instructions: "Clean behind appliances, wash windows, detail baseboards.",
            isDeepClean: true,
            sortOrder: 10,
          },
          {
            section: "Exception handling",
            title: "Document exceptions",
            instructions: "Flag damage, missing items, or access issues immediately in Issues.",
            isException: true,
            sortOrder: 11,
          },
          {
            section: "Completion sign-off",
            title: "Sign off turnover",
            instructions: "Confirm all checklist items and photos; mark ready for QA.",
            sortOrder: 12,
          },
        ],
      },
    },
  });

  const sow = await prisma.sowTemplate.create({
    data: {
      companyId: company.id,
      name: "Standard Turnover SOW",
      description: "Default scope of work for same-day turnovers.",
      standardScope:
        "Full clean, linen change, bathroom sanitize, kitchen wipe, floor care, restock consumables, photo proof, and final walkthrough.",
      addOns: JSON.stringify([
        "Same-day rush (+$40)",
        "Pet hair treatment",
        "Laundry on-site",
        "Hot tub reset",
      ]),
      photoReqs: JSON.stringify([
        "Kitchen after clean",
        "Bathroom after clean",
        "Bedroom staged",
        "Final living room",
      ]),
      slaMinutes: 240,
      damageRules: "Photograph and escalate any damage over $50 estimated repair.",
      missingItemRules: "Report missing inventory or amenities before leaving the property.",
      requiresSignOff: true,
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
      maxGuests: 4,
      calendarUrl: "https://calendar.example.com/hvl-101.ics",
      calendarSyncedAt: new Date(),
      sopId: sop.id,
      sowTemplateId: sow.id,
      ownerId: owner.id,
      notes: "Lockbox code in vault. Parking spot B2.",
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
      maxGuests: 2,
      calendarUrl: "https://calendar.example.com/cc-12.ics",
      sopId: sop.id,
      sowTemplateId: sow.id,
      ownerId: owner.id,
    },
  });

  const cleaner = await prisma.teamMember.create({
    data: {
      companyId: company.id,
      name: "Jordan Lee",
      email: "jordan.cleaner@pacificstay.ops",
      phone: "+1-555-0144",
      role: Role.CLEANER,
      skills: JSON.stringify(["standard", "deep-clean", "laundry"]),
      maxJobsPerDay: 4,
    },
  });

  await prisma.teamMember.create({
    data: {
      companyId: company.id,
      name: "Chris Ortiz",
      email: "chris.vendor@pacificstay.ops",
      phone: "+1-555-0199",
      role: Role.VENDOR,
      skills: JSON.stringify(["plumbing", "appliance", "general"]),
    },
  });

  await prisma.teamMember.create({
    data: {
      companyId: company.id,
      name: "Sam Chen",
      email: "sam.coord@pacificstay.ops",
      role: Role.CLEANING_COORDINATOR,
      skills: JSON.stringify(["dispatch", "qa"]),
    },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(10, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(15, 0, 0, 0);

  const booking = await prisma.booking.create({
    data: {
      propertyId: propertyA.id,
      externalId: "airbnb-1001",
      guestName: "Guest Party",
      checkIn: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      checkOut: todayStart,
      source: "calendar_sync",
    },
  });

  const turnover = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyA.id,
      bookingId: booking.id,
      sopId: sop.id,
      sowTemplateId: sow.id,
      status: "IN_PROGRESS",
      windowStart: todayStart,
      windowEnd: todayEnd,
      deadlineAt: todayEnd,
      isDeepClean: false,
      scopeJson: JSON.stringify({
        standardScope: sow.standardScope,
        photoReqs: JSON.parse(sow.photoReqs),
      }),
      addOnsJson: JSON.stringify(["Pet hair treatment"]),
    },
  });

  await prisma.cleanerAssignment.create({
    data: {
      turnoverId: turnover.id,
      teamMemberId: cleaner.id,
      status: "dispatched",
      dispatchedAt: new Date(),
      notes: "Dispatched with full checklist",
    },
  });

  const steps = await prisma.sopStep.findMany({
    where: { sopId: sop.id, isDeepClean: false },
    orderBy: { sortOrder: "asc" },
  });

  await prisma.checklistItem.createMany({
    data: steps.map((s, idx) => ({
      turnoverId: turnover.id,
      section: s.section,
      title: s.title,
      instructions: s.instructions,
      requiresPhoto: s.requiresPhoto,
      sortOrder: idx,
      completed: idx < 4,
      completedAt: idx < 4 ? new Date() : null,
      completedById: idx < 4 ? manager.id : null,
    })),
  });

  await prisma.photoSubmission.createMany({
    data: [
      {
        turnoverId: turnover.id,
        label: "Kitchen after clean",
        section: "Room-by-room",
        url: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800",
        verified: true,
        verifiedAt: new Date(),
        aiScore: 0.92,
        aiNotes: "Photo meets framing and cleanliness criteria.",
        uploadedById: manager.id,
      },
      {
        turnoverId: turnover.id,
        label: "Bathroom after clean",
        section: "Room-by-room",
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
        verified: false,
        aiScore: 0.71,
        aiNotes: "Photo may be blurry or incomplete — re-shoot recommended.",
        rejected: false,
        uploadedById: manager.id,
      },
    ],
  });

  await prisma.issue.create({
    data: {
      turnoverId: turnover.id,
      title: "Hairline crack in bathroom vanity",
      description: "Small crack on left corner of vanity countertop. Not leaking.",
      severity: "MEDIUM",
      status: "OPEN",
      category: "damage",
      reportedById: coordinator.id,
    },
  });

  const overdueStart = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const overdueEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000);
  await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyB.id,
      sopId: sop.id,
      sowTemplateId: sow.id,
      status: "OVERDUE",
      windowStart: overdueStart,
      windowEnd: overdueEnd,
      deadlineAt: overdueEnd,
      scopeJson: "{}",
      addOnsJson: "[]",
    },
  });

  await prisma.inventoryItem.createMany({
    data: [
      {
        companyId: company.id,
        propertyId: propertyA.id,
        name: "Toilet paper (rolls)",
        category: "bathroom",
        quantity: 4,
        reorderLevel: 8,
        unit: "rolls",
      },
      {
        companyId: company.id,
        propertyId: propertyA.id,
        name: "Bath towels",
        category: "linen",
        quantity: 12,
        reorderLevel: 6,
        unit: "each",
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
        quantity: 3,
        reorderLevel: 5,
        unit: "bottles",
      },
    ],
  });

  await prisma.agentAction.createMany({
    data: [
      {
        companyId: company.id,
        turnoverId: turnover.id,
        agentType: "PHOTO_VERIFICATION",
        title: "Verify remaining photo proofs",
        description: "Bathroom photo scored below threshold. Approve re-verification or request re-shoot.",
        payloadJson: JSON.stringify({ focus: "Bathroom after clean" }),
        status: "PENDING_APPROVAL",
      },
      {
        companyId: company.id,
        turnoverId: turnover.id,
        agentType: "ISSUE_ESCALATION",
        title: "Escalate vanity crack to vendor",
        description: "Recommend dispatching handyman for vanity inspection before next guest.",
        payloadJson: JSON.stringify({
          title: "Vanity crack inspection",
          description: "Inspect and quote repair for bathroom vanity crack.",
          severity: "MEDIUM",
          category: "damage",
        }),
        status: "PENDING_APPROVAL",
      },
      {
        companyId: company.id,
        agentType: "INVENTORY_RESTOCK",
        title: "Restock low supplies",
        description: "Toilet paper and dishwasher pods are below reorder level.",
        payloadJson: JSON.stringify({}),
        status: "PENDING_APPROVAL",
      },
    ],
  });

  await prisma.backgroundJob.createMany({
    data: [
      {
        companyId: company.id,
        type: "turnover.overdue_check",
        status: "PENDING",
        runAt: new Date(),
        payloadJson: "{}",
      },
      {
        companyId: company.id,
        type: "inventory.alert_scan",
        status: "PENDING",
        runAt: new Date(),
        payloadJson: "{}",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: company.id,
        userId: manager.id,
        action: "company.onboarded",
        entityType: "Company",
        entityId: company.id,
        metadata: JSON.stringify({ step: "complete" }),
      },
      {
        companyId: company.id,
        userId: coordinator.id,
        action: "turnover.assigned",
        entityType: "Turnover",
        entityId: turnover.id,
        metadata: JSON.stringify({ cleaner: cleaner.name }),
      },
    ],
  });

  console.log("Seeded Hostpitality demo data");
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
