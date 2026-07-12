import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.backgroundJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.sopVersion.deleteMany();
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

  const { getTemplate, serializeSopDocument } = await import("../src/lib/sops");
  const apartmentTemplate = getTemplate("apartment_2br")!;
  const studioTemplate = getTemplate("studio_turnover")!;
  const now = new Date();

  const sop = await prisma.sop.create({
    data: {
      companyId: company.id,
      name: "Standard Turnover SOP",
      description: "Foundation playbook for 2BR apartments",
      version: 2,
      contentJson: serializeSopDocument(apartmentTemplate.document),
      status: "PUBLISHED",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      templateKey: apartmentTemplate.key,
      unitType: "apartment",
      safetyNotes: apartmentTemplate.safetyNotes,
      active: true,
    },
  });
  await prisma.sopVersion.createMany({
    data: [
      {
        sopId: sop.id,
        version: 1,
        name: "Standard Turnover SOP",
        description: "Initial draft",
        contentJson: serializeSopDocument(studioTemplate.document),
        safetyNotes: studioTemplate.safetyNotes,
        changeNote: "Initial draft from studio starter",
        actorName: "Alex Morgan",
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        sopId: sop.id,
        version: 2,
        name: "Standard Turnover SOP",
        description: "Foundation playbook for 2BR apartments",
        contentJson: serializeSopDocument(apartmentTemplate.document),
        safetyNotes: apartmentTemplate.safetyNotes,
        changeNote: "Published apartment playbook",
        actorName: "Alex Morgan",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const draftSop = await prisma.sop.create({
    data: {
      companyId: company.id,
      name: "Studio express clean",
      description: "Draft playbook for compact units",
      version: 1,
      contentJson: serializeSopDocument(studioTemplate.document),
      status: "DRAFT",
      templateKey: studioTemplate.key,
      unitType: "studio",
      safetyNotes: studioTemplate.safetyNotes,
      active: false,
    },
  });
  await prisma.sopVersion.create({
    data: {
      sopId: draftSop.id,
      version: 1,
      name: draftSop.name,
      description: draftSop.description,
      contentJson: draftSop.contentJson,
      safetyNotes: draftSop.safetyNotes,
      changeNote: "Created from studio template",
      actorName: "Alex Morgan",
    },
  });

  const sow = await prisma.sow.create({
    data: {
      companyId: company.id,
      name: "Standard SOW",
      standardScope: "Full clean, linen change, restock, photo proof.",
      addOnsJson: JSON.stringify(["Pet hair treatment", "Rush turnover"]),
      slaMinutes: 240,
    },
  });

  const photoReqs = JSON.stringify([
    { label: "Kitchen after clean", required: true },
    { label: "Bathroom after clean", required: true },
    { label: "Bedroom staged", required: true },
    { label: "Final living room", required: true },
  ]);
  const restock = JSON.stringify([
    { name: "Toilet paper", quantity: 4, unit: "rolls" },
    { name: "Paper towels", quantity: 2, unit: "rolls" },
    { name: "Dishwasher pods", quantity: 4, unit: "pods" },
  ]);

  const propertyA = await prisma.property.create({
    data: {
      companyId: company.id,
      name: "Harbor View Loft",
      unitCode: "HVL-101",
      address: "120 Pier Street",
      city: "Santa Barbara",
      state: "CA",
      unitType: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      maxGuests: 4,
      calendarUrl: "https://calendar.example.com/hvl-101.ics",
      bookingSource: "airbnb",
      calendarStatus: "synced",
      calendarSyncedAt: new Date(),
      sopId: sop.id,
      sowId: sow.id,
      defaultVendorId: jordan.id,
      photoRequirementsJson: photoReqs,
      restockDefaultsJson: restock,
      accessNotes: "Lockbox on porch rail. Code in vault.",
      turnoverBufferMins: 90,
      sameDayTurnover: true,
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
      unitType: "cabin",
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      bookingSource: "vrbo",
      calendarStatus: "pending",
      sopId: sop.id,
      sowId: sow.id,
      defaultVendorId: sam.id,
      photoRequirementsJson: photoReqs,
      restockDefaultsJson: restock,
      accessNotes: "Keypad on side door.",
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
      unitType: "studio",
      bedrooms: 0,
      bathrooms: 1,
      maxGuests: 2,
      bookingSource: "direct",
      calendarStatus: "not_connected",
      photoRequirementsJson: photoReqs,
      restockDefaultsJson: restock,
    },
  });

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

  const sopSteps = [
    { section: "Pre-turnover prep", title: "Gather supplies", instructions: "Load caddy and linens", requiresPhoto: false },
    { section: "Room-by-room", title: "Clean kitchen and baths", instructions: "Follow room playbook", requiresPhoto: true },
    { section: "Completion sign-off", title: "Sign off", instructions: "Confirm ready for QA", requiresPhoto: false },
  ];

  async function seedChecklist(
    turnoverId: string,
    opts?: { completeFirst?: boolean; completeAll?: boolean }
  ) {
    await prisma.turnoverChecklistItem.createMany({
      data: sopSteps.map((step, idx) => {
        const completed = Boolean(opts?.completeAll || (opts?.completeFirst && idx === 0));
        return {
          turnoverId,
          section: step.section,
          title: step.title,
          instructions: step.instructions,
          requiresPhoto: step.requiresPhoto,
          sortOrder: idx,
          completed,
          completedAt: completed ? new Date(now.getTime() - 30 * 60 * 1000) : null,
          completedBy: completed ? "Jordan Lee" : null,
        };
      }),
    });
  }

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
  await seedChecklist(turnoverToday.id, { completeFirst: true });
  await prisma.turnoverStatusEvent.createMany({
    data: [
      {
        turnoverId: turnoverToday.id,
        fromStatus: null,
        toStatus: "SCHEDULED",
        note: "Created from Airbnb checkout",
        actorName: "System",
        createdAt: new Date(now.getTime() - 20 * 60 * 60 * 1000),
      },
      {
        turnoverId: turnoverToday.id,
        fromStatus: "SCHEDULED",
        toStatus: "ASSIGNED",
        note: "Default cleaner applied",
        actorName: "Alex Morgan",
        createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
      },
      {
        turnoverId: turnoverToday.id,
        fromStatus: "ASSIGNED",
        toStatus: "IN_PROGRESS",
        note: "Cleaner checked in",
        actorName: "Jordan Lee",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
  });
  await prisma.turnoverAssignmentEvent.create({
    data: {
      turnoverId: turnoverToday.id,
      fromVendorId: null,
      toVendorId: jordan.id,
      fromName: null,
      toName: jordan.name,
      note: "Auto-assigned default property cleaner",
      actorName: "Alex Morgan",
      createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
  });

  const turnoverAssigned = await prisma.turnover.create({
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
  await seedChecklist(turnoverAssigned.id);
  await prisma.turnoverStatusEvent.createMany({
    data: [
      {
        turnoverId: turnoverAssigned.id,
        fromStatus: null,
        toStatus: "SCHEDULED",
        actorName: "System",
      },
      {
        turnoverId: turnoverAssigned.id,
        fromStatus: "SCHEDULED",
        toStatus: "ASSIGNED",
        note: "Assigned to Sam Rivera",
        actorName: "Alex Morgan",
      },
    ],
  });
  await prisma.turnoverAssignmentEvent.create({
    data: {
      turnoverId: turnoverAssigned.id,
      toVendorId: sam.id,
      toName: sam.name,
      note: "Initial assignment",
      actorName: "Alex Morgan",
    },
  });

  const turnoverScheduled = await prisma.turnover.create({
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
  await seedChecklist(turnoverScheduled.id);
  await prisma.turnoverStatusEvent.create({
    data: {
      turnoverId: turnoverScheduled.id,
      fromStatus: null,
      toStatus: "SCHEDULED",
      note: "Created from calendar sync",
      actorName: "System",
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
  await seedChecklist(overdue.id, { completeFirst: true });
  await prisma.turnoverStatusEvent.createMany({
    data: [
      {
        turnoverId: overdue.id,
        fromStatus: null,
        toStatus: "ASSIGNED",
        actorName: "System",
        createdAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
      },
      {
        turnoverId: overdue.id,
        fromStatus: "ASSIGNED",
        toStatus: "IN_PROGRESS",
        actorName: "Sam Rivera",
        createdAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      },
      {
        turnoverId: overdue.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "OVERDUE",
        note: "Marked overdue by background job",
        actorName: "system",
        createdAt: new Date(now.getTime() - 22 * 60 * 60 * 1000),
      },
    ],
  });

  const readyForQa = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyA.id,
      sopId: sop.id,
      sowId: sow.id,
      vendorId: jordan.id,
      status: "READY_FOR_QA",
      priority: "NORMAL",
      windowStart: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      windowEnd: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      deadlineAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
      photosRequired: 4,
      photosUploaded: 4,
      photosVerified: 0,
      notes: "Checklist complete — awaiting QA phase",
    },
  });
  await seedChecklist(readyForQa.id, { completeAll: true });
  await prisma.turnoverStatusEvent.createMany({
    data: [
      {
        turnoverId: readyForQa.id,
        fromStatus: null,
        toStatus: "ASSIGNED",
        actorName: "System",
      },
      {
        turnoverId: readyForQa.id,
        fromStatus: "ASSIGNED",
        toStatus: "IN_PROGRESS",
        actorName: "Jordan Lee",
      },
      {
        turnoverId: readyForQa.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "READY_FOR_QA",
        note: "All checklist items complete",
        actorName: "Jordan Lee",
      },
    ],
  });

  const draftTurnover = await prisma.turnover.create({
    data: {
      companyId: company.id,
      propertyId: propertyC.id,
      sopId: sop.id,
      sowId: sow.id,
      status: "DRAFT",
      priority: "LOW",
      windowStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      windowEnd: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      deadlineAt: new Date(now.getTime() + 28 * 60 * 60 * 1000),
      photosRequired: 3,
      notes: "Draft from upcoming booking change",
    },
  });
  await seedChecklist(draftTurnover.id);
  await prisma.turnoverStatusEvent.create({
    data: {
      turnoverId: draftTurnover.id,
      fromStatus: null,
      toStatus: "DRAFT",
      note: "Draft created from booking change",
      actorName: "Alex Morgan",
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
  await seedChecklist(completedRecent.id, { completeAll: true });
  await prisma.turnoverStatusEvent.createMany({
    data: [
      {
        turnoverId: completedRecent.id,
        fromStatus: null,
        toStatus: "ASSIGNED",
        actorName: "System",
      },
      {
        turnoverId: completedRecent.id,
        fromStatus: "ASSIGNED",
        toStatus: "IN_PROGRESS",
        actorName: "Jordan Lee",
      },
      {
        turnoverId: completedRecent.id,
        fromStatus: "IN_PROGRESS",
        toStatus: "READY_FOR_QA",
        actorName: "Jordan Lee",
      },
      {
        turnoverId: completedRecent.id,
        fromStatus: "READY_FOR_QA",
        toStatus: "COMPLETED",
        note: "Closed after QA (seed history)",
        actorName: "Alex Morgan",
      },
    ],
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
