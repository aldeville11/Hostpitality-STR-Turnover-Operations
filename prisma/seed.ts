import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.backgroundJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.integrationWebhookLog.deleteMany();
  await prisma.integrationSyncEvent.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.issueComment.deleteMany();
  await prisma.issueEvent.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.qaInspectionEvent.deleteMany();
  await prisma.qaInspectionItem.deleteMany();
  await prisma.qaPhotoReview.deleteMany();
  await prisma.qaInspection.deleteMany();
  await prisma.sopVersion.deleteMany();
  await prisma.sowVersion.deleteMany();
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
      brandName: "Pacific Stay",
      accentColor: "#0F766E",
      supportEmail: "ops@pacificstay.ops",
      supportPhone: "+1-805-555-0100",
      contactName: "Alex Rivera",
      logoUrl: null,
      notificationPrefsJson: JSON.stringify({
        emailAssignments: true,
        emailQaOutcomes: true,
        emailIssueUpdates: true,
        smsUrgentOnly: true,
        digestDaily: false,
      }),
      workingHoursJson: JSON.stringify({
        timezone: "America/Los_Angeles",
        days: ["mon", "tue", "wed", "thu", "fri", "sat"],
        start: "08:00",
        end: "18:00",
      }),
      systemSettingsJson: JSON.stringify({
        issueCategories: ["damage", "missing", "qa", "access", "clean_miss", "restock", "other"],
        issueSeverities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        turnoverStatuses: [
          "DRAFT",
          "SCHEDULED",
          "ASSIGNED",
          "IN_PROGRESS",
          "READY_FOR_QA",
          "NEEDS_REWORK",
          "COMPLETED",
          "BLOCKED",
          "OVERDUE",
          "CANCELLED",
        ],
        slaHoursBySeverity: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 },
        defaultTurnoverBufferMins: 60,
        defaultSlaMinutes: 240,
        featureFlags: {
          calendarSync: true,
          messagingHooks: true,
          reportingExports: true,
          integrations: true,
          ownerSummaries: false,
        },
        defaultSopId: null,
        defaultSowId: null,
      }),
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
      accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
    },
  });

  await prisma.user.create({
    data: {
      email: "cleaner@hostpitality.app",
      name: "Jordan Lee",
      passwordHash,
      role: "CLEANER",
      companyId: company.id,
      accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
    },
  });

  await prisma.user.create({
    data: {
      email: "dispatcher@hostpitality.app",
      name: "Casey Nguyen",
      passwordHash,
      role: "CLEANING_COORDINATOR",
      companyId: company.id,
      accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
    },
  });

  await prisma.user.create({
    data: {
      email: "inspector@hostpitality.app",
      name: "Riley Quinn",
      passwordHash,
      role: "PROPERTY_MANAGER",
      companyId: company.id,
      accessScopeJson: JSON.stringify({ allProperties: true, propertyIds: [] }),
    },
  });

  const jordan = await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Jordan Lee",
      email: "jordan.cleaner@pacificstay.ops",
      type: "CLEANER",
      phone: "+1-555-0144",
      coverageAreasJson: JSON.stringify(["Santa Barbara", "Montecito"]),
      skillsJson: JSON.stringify(["apartment", "condo", "deep_clean"]),
      capacity: 4,
      rating: 4.8,
      availabilityStatus: "AVAILABLE",
    },
  });

  const sam = await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Sam Ortiz",
      email: "sam.cleaner@pacificstay.ops",
      type: "CLEANER",
      phone: "+1-555-0188",
      coverageAreasJson: JSON.stringify(["Santa Barbara"]),
      skillsJson: JSON.stringify(["apartment", "studio"]),
      capacity: 3,
      rating: 4.5,
      availabilityStatus: "AVAILABLE",
    },
  });

  await prisma.vendor.create({
    data: {
      companyId: company.id,
      name: "Chris Handyman",
      email: "chris.vendor@pacificstay.ops",
      type: "VENDOR",
      coverageAreasJson: JSON.stringify(["Santa Barbara", "Goleta"]),
      skillsJson: JSON.stringify(["house", "vendor"]),
      capacity: 2,
      rating: 4.2,
      availabilityStatus: "UNAVAILABLE",
      unavailableReason: "On another property punch-list",
      unavailableUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
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

  const {
    starterDocument,
    serializeSowDocument,
    scopeSummaryFromDocument,
    addOnsJsonFromDocument,
  } = await import("../src/lib/sows");
  const sowDoc = starterDocument();
  const sowContentJson = serializeSowDocument(sowDoc);

  const sow = await prisma.sow.create({
    data: {
      companyId: company.id,
      name: "Standard SOW",
      description: "Default turnover scope for coastal apartments",
      standardScope: scopeSummaryFromDocument(sowDoc),
      addOnsJson: addOnsJsonFromDocument(sowDoc),
      contentJson: sowContentJson,
      slaMinutes: 240,
      completionDeadlineMinutes: 240,
      version: 2,
      status: "ACTIVE",
      unitType: "apartment",
      useCase: "Standard turnover",
      propertyGroup: "Coastal units",
      active: true,
      approvedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      approvedById: manager.id,
      approvedByName: manager.name,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.sowVersion.createMany({
    data: [
      {
        sowId: sow.id,
        version: 1,
        name: "Standard SOW",
        description: "Initial draft",
        standardScope: sow.standardScope,
        addOnsJson: sow.addOnsJson,
        contentJson: sowContentJson,
        slaMinutes: 240,
        completionDeadlineMinutes: 240,
        useCase: "Standard turnover",
        unitType: "apartment",
        propertyGroup: "Coastal units",
        status: "DRAFT",
        changeNote: "Initial draft",
        actorName: manager.name,
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        sowId: sow.id,
        version: 2,
        name: "Standard SOW",
        description: sow.description,
        standardScope: sow.standardScope,
        addOnsJson: sow.addOnsJson,
        contentJson: sowContentJson,
        slaMinutes: 240,
        completionDeadlineMinutes: 240,
        useCase: "Standard turnover",
        unitType: "apartment",
        propertyGroup: "Coastal units",
        status: "ACTIVE",
        changeNote: "Approved and activated",
        actorName: manager.name,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const rushDoc = starterDocument();
  rushDoc.addOns = [
    ...rushDoc.addOns,
    {
      id: "addon_same_day",
      name: "Same-day buffer under 2h",
      description: "Coordinator-approved rush only",
      priceNote: "+$120",
      requiresApproval: true,
    },
  ];
  const rushSow = await prisma.sow.create({
    data: {
      companyId: company.id,
      name: "Same-day rush SOW",
      description: "Compressed SLA for same-day turnovers",
      standardScope: scopeSummaryFromDocument(rushDoc),
      addOnsJson: addOnsJsonFromDocument(rushDoc),
      contentJson: serializeSowDocument(rushDoc),
      slaMinutes: 180,
      completionDeadlineMinutes: 180,
      version: 1,
      status: "PENDING_REVIEW",
      unitType: "apartment",
      useCase: "Same-day rush",
      propertyGroup: "Coastal units",
      active: false,
    },
  });
  await prisma.sowVersion.create({
    data: {
      sowId: rushSow.id,
      version: 1,
      name: rushSow.name,
      description: rushSow.description,
      standardScope: rushSow.standardScope,
      addOnsJson: rushSow.addOnsJson,
      contentJson: rushSow.contentJson,
      slaMinutes: rushSow.slaMinutes,
      completionDeadlineMinutes: rushSow.completionDeadlineMinutes,
      useCase: rushSow.useCase,
      unitType: rushSow.unitType,
      propertyGroup: rushSow.propertyGroup,
      status: "PENDING_REVIEW",
      changeNote: "Submitted for ops review",
      actorName: manager.name,
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

  const readyChecklist = await prisma.turnoverChecklistItem.findMany({
    where: { turnoverId: readyForQa.id },
    orderBy: { sortOrder: "asc" },
  });
  await prisma.qaInspection.create({
    data: {
      companyId: company.id,
      turnoverId: readyForQa.id,
      status: "PENDING",
      inspectorId: manager.id,
      inspectorName: manager.name,
      startedAt: new Date(now.getTime() - 20 * 60 * 1000),
      items: {
        create: readyChecklist.map((item, idx) => ({
          checklistItemId: item.id,
          section: item.section,
          title: item.title,
          result: idx === 0 ? "PASS" : "PENDING",
          reviewedAt: idx === 0 ? new Date(now.getTime() - 15 * 60 * 1000) : null,
          sortOrder: idx,
        })),
      },
      photos: {
        create: [
          {
            label: "Kitchen after clean",
            required: true,
            uploaded: true,
            result: "PASS",
            reviewedAt: new Date(now.getTime() - 10 * 60 * 1000),
            sortOrder: 0,
          },
          {
            label: "Bathroom after clean",
            required: true,
            uploaded: true,
            result: "PENDING",
            sortOrder: 1,
          },
          {
            label: "Bedroom staged",
            required: true,
            uploaded: true,
            result: "PENDING",
            sortOrder: 2,
          },
          {
            label: "Final living room",
            required: true,
            uploaded: true,
            result: "PENDING",
            sortOrder: 3,
          },
        ],
      },
      events: {
        create: [
          {
            turnoverId: readyForQa.id,
            fromStatus: null,
            toStatus: "PENDING",
            note: "QA inspection opened",
            actorName: manager.name,
            createdAt: new Date(now.getTime() - 20 * 60 * 1000),
          },
        ],
      },
    },
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
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      },
    ],
  });

  // Historical turnovers for reporting trends (last ~2 weeks)
  const historySpecs: Array<{
    daysAgo: number;
    propertyId: string;
    vendorId: string;
    late: boolean;
    qa: "APPROVED" | "NEEDS_REWORK" | "REJECTED";
    failKitchen: boolean;
    reinspect?: boolean;
  }> = [
    {
      daysAgo: 12,
      propertyId: propertyA.id,
      vendorId: jordan.id,
      late: false,
      qa: "APPROVED",
      failKitchen: false,
    },
    {
      daysAgo: 10,
      propertyId: propertyB.id,
      vendorId: sam.id,
      late: true,
      qa: "NEEDS_REWORK",
      failKitchen: true,
    },
    {
      daysAgo: 9,
      propertyId: propertyB.id,
      vendorId: sam.id,
      late: false,
      qa: "APPROVED",
      failKitchen: false,
      reinspect: true,
    },
    {
      daysAgo: 7,
      propertyId: propertyC.id,
      vendorId: jordan.id,
      late: false,
      qa: "APPROVED",
      failKitchen: false,
    },
    {
      daysAgo: 5,
      propertyId: propertyA.id,
      vendorId: jordan.id,
      late: false,
      qa: "REJECTED",
      failKitchen: true,
    },
    {
      daysAgo: 4,
      propertyId: propertyA.id,
      vendorId: jordan.id,
      late: false,
      qa: "APPROVED",
      failKitchen: false,
      reinspect: true,
    },
    {
      daysAgo: 3,
      propertyId: propertyC.id,
      vendorId: sam.id,
      late: true,
      qa: "APPROVED",
      failKitchen: false,
    },
  ];

  for (const spec of historySpecs) {
    const start = new Date(now.getTime() - spec.daysAgo * 24 * 60 * 60 * 1000);
    start.setHours(10, 0, 0, 0);
    const deadline = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const completedAt = new Date(
      deadline.getTime() + (spec.late ? 90 * 60 * 1000 : -30 * 60 * 1000)
    );
    const cleanerName = spec.vendorId === jordan.id ? jordan.name : sam.name;
    const hist = await prisma.turnover.create({
      data: {
        companyId: company.id,
        propertyId: spec.propertyId,
        sopId: sop.id,
        sowId: sow.id,
        vendorId: spec.vendorId,
        status: "COMPLETED",
        priority: "NORMAL",
        windowStart: start,
        windowEnd: deadline,
        deadlineAt: deadline,
        photosRequired: 4,
        photosUploaded: 4,
        photosVerified: spec.qa === "APPROVED" ? 4 : 3,
        ownerNotifiedAt: new Date(completedAt.getTime() + 20 * 60 * 1000),
      },
    });
    await seedChecklist(hist.id, { completeAll: true });
    await prisma.turnoverChecklistItem.create({
      data: {
        turnoverId: hist.id,
        section: "Restock",
        title: "Restock linens & paper",
        instructions: "Top up bathrooms and kitchen paper",
        requiresPhoto: false,
        sortOrder: 10,
        completed: true,
        completedAt: new Date(start.getTime() + 2 * 60 * 60 * 1000),
        completedBy: cleanerName,
      },
    });
    await prisma.turnoverStatusEvent.createMany({
      data: [
        {
          turnoverId: hist.id,
          fromStatus: null,
          toStatus: "ASSIGNED",
          actorName: "System",
          createdAt: new Date(start.getTime() - 12 * 60 * 60 * 1000),
        },
        {
          turnoverId: hist.id,
          fromStatus: "ASSIGNED",
          toStatus: "IN_PROGRESS",
          actorName: cleanerName,
          createdAt: start,
        },
        {
          turnoverId: hist.id,
          fromStatus: "IN_PROGRESS",
          toStatus: "READY_FOR_QA",
          actorName: cleanerName,
          createdAt: new Date(start.getTime() + 3 * 60 * 60 * 1000),
        },
        ...(spec.qa === "NEEDS_REWORK" || spec.qa === "REJECTED"
          ? [
              {
                turnoverId: hist.id,
                fromStatus: "READY_FOR_QA",
                toStatus: "NEEDS_REWORK",
                actorName: manager.name,
                createdAt: new Date(start.getTime() + 3 * 60 * 60 * 1000 + 30 * 60 * 1000),
              },
              {
                turnoverId: hist.id,
                fromStatus: "NEEDS_REWORK",
                toStatus: "READY_FOR_QA",
                actorName: cleanerName,
                createdAt: new Date(start.getTime() + 5 * 60 * 60 * 1000),
              },
            ]
          : []),
        {
          turnoverId: hist.id,
          fromStatus: "READY_FOR_QA",
          toStatus: "COMPLETED",
          note: "Historical completion",
          actorName: manager.name,
          createdAt: completedAt,
        },
      ],
    });

    const firstInspection = await prisma.qaInspection.create({
      data: {
        companyId: company.id,
        turnoverId: hist.id,
        status: spec.reinspect ? "NEEDS_REWORK" : spec.qa,
        inspectorId: manager.id,
        inspectorName: manager.name,
        startedAt: new Date(start.getTime() + 3 * 60 * 60 * 1000 + 12 * 60 * 1000),
        completedAt: new Date(start.getTime() + 3 * 60 * 60 * 1000 + 36 * 60 * 1000),
        decisionNote: spec.failKitchen ? "Kitchen presentation incomplete" : "Looks good",
        items: {
          create: [
            {
              section: "Kitchen",
              title: "Counters wiped",
              result: spec.failKitchen ? "FAIL" : "PASS",
              comment: spec.failKitchen ? "Residue on island" : null,
              sortOrder: 0,
            },
            {
              section: "Bathroom",
              title: "Vanity staged",
              result: "PASS",
              sortOrder: 1,
            },
            {
              section: "Restock",
              title: "Restock linens & paper",
              result: "PASS",
              sortOrder: 2,
            },
          ],
        },
        photos: {
          create: [
            {
              label: "Kitchen wide",
              required: true,
              uploaded: true,
              result: spec.failKitchen ? "FAIL" : "PASS",
              comment: spec.failKitchen ? "Framing incomplete" : null,
              sortOrder: 0,
            },
            {
              label: "Bathroom after clean",
              required: true,
              uploaded: true,
              result: "PASS",
              sortOrder: 1,
            },
          ],
        },
      },
    });

    if (spec.reinspect) {
      await prisma.qaInspection.create({
        data: {
          companyId: company.id,
          turnoverId: hist.id,
          status: "APPROVED",
          inspectorId: manager.id,
          inspectorName: manager.name,
          startedAt: new Date(start.getTime() + 5 * 60 * 60 * 1000 + 12 * 60 * 1000),
          completedAt: new Date(start.getTime() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000),
          decisionNote: "Passed on reinspection",
          items: {
            create: [
              {
                section: "Kitchen",
                title: "Counters wiped",
                result: "PASS",
                sortOrder: 0,
              },
              {
                section: "Bathroom",
                title: "Vanity staged",
                result: "PASS",
                sortOrder: 1,
              },
            ],
          },
          photos: {
            create: [
              {
                label: "Kitchen wide",
                required: true,
                uploaded: true,
                result: "PASS",
                sortOrder: 0,
              },
            ],
          },
        },
      });
    }

    if (spec.failKitchen) {
      await prisma.issue.create({
        data: {
          companyId: company.id,
          propertyId: spec.propertyId,
          turnoverId: hist.id,
          qaInspectionId: firstInspection.id,
          title: "Kitchen photo rejected",
          description: "QA failed — framing incomplete, re-shoot required.",
          severity: "MEDIUM",
          status: spec.daysAgo > 6 ? "CLOSED" : "RESOLVED",
          category: "qa",
          source: "QA_FAILURE",
          blocking: false,
          ownerUserId: manager.id,
          ownerName: manager.name,
          assigneeVendorId: spec.vendorId,
          assigneeName: cleanerName,
          resolvedAt: new Date(completedAt.getTime() + 6 * 60 * 60 * 1000),
          closedAt:
            spec.daysAgo > 6
              ? new Date(completedAt.getTime() + 12 * 60 * 60 * 1000)
              : null,
          createdAt: new Date(start.getTime() + 3 * 60 * 60 * 1000 + 42 * 60 * 1000),
        },
      });
    }
  }

  const dueSoon = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const overdueDue = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const issueVanity = await prisma.issue.create({
    data: {
      companyId: company.id,
      propertyId: propertyA.id,
      turnoverId: turnoverToday.id,
      title: "Hairline crack in bathroom vanity",
      description: "Small crack on left corner of vanity countertop. Not leaking.",
      severity: "MEDIUM",
      status: "OPEN",
      category: "damage",
      source: "TURNOVER_BLOCK",
      blocking: true,
      ownerUserId: manager.id,
      ownerName: manager.name,
      dueAt: dueSoon,
      photosJson: JSON.stringify(["vanity-crack.jpg"]),
    },
  });

  await prisma.issueEvent.create({
    data: {
      issueId: issueVanity.id,
      type: "STATUS",
      fromValue: null,
      toValue: "OPEN",
      note: "Created from turnover block",
      actorId: manager.id,
      actorName: manager.name,
    },
  });

  await prisma.issueComment.create({
    data: {
      issueId: issueVanity.id,
      body: "Guest checkout reported the crack. Confirm before next arrival.",
      visibility: "INTERNAL",
      actorId: manager.id,
      actorName: manager.name,
    },
  });

  const issueDryer = await prisma.issue.create({
    data: {
      companyId: company.id,
      propertyId: propertyB.id,
      turnoverId: overdue.id,
      title: "Missing hair dryer",
      description: "Bathroom amenity not found during turnover.",
      severity: "HIGH",
      status: "ESCALATED",
      category: "missing",
      source: "MANUAL",
      blocking: true,
      ownerUserId: manager.id,
      ownerName: manager.name,
      assigneeVendorId: jordan.id,
      assigneeName: jordan.name,
      dueAt: overdueDue,
      escalatedAt: new Date(Date.now() - 60 * 60 * 1000),
    },
  });

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issueDryer.id,
        type: "STATUS",
        toValue: "OPEN",
        note: "Opened from field report",
        actorName: manager.name,
      },
      {
        issueId: issueDryer.id,
        type: "ASSIGNMENT",
        toValue: jordan.name,
        note: "Assigned to on-site cleaner",
        actorName: manager.name,
      },
      {
        issueId: issueDryer.id,
        type: "ESCALATION",
        fromValue: "ASSIGNED",
        toValue: "ESCALATED",
        note: "Past SLA — guest arrival soon",
        actorName: manager.name,
      },
    ],
  });

  await prisma.issueComment.create({
    data: {
      issueId: issueDryer.id,
      body: "Replacement ordered; ETA this afternoon.",
      visibility: "EXTERNAL",
      actorId: manager.id,
      actorName: manager.name,
    },
  });

  const issueKitchen = await prisma.issue.create({
    data: {
      companyId: company.id,
      propertyId: propertyB.id,
      turnoverId: overdue.id,
      title: "Kitchen photo rejected",
      description: "QA failed — framing incomplete, re-shoot required.",
      severity: "LOW",
      status: "ASSIGNED",
      category: "qa",
      source: "QA_FAILURE",
      blocking: false,
      ownerUserId: manager.id,
      ownerName: manager.name,
      assigneeVendorId: sam.id,
      assigneeName: sam.name,
      dueAt: new Date(Date.now() + 20 * 60 * 60 * 1000),
      photosJson: JSON.stringify(["kitchen-wide"]),
    },
  });

  await prisma.issueEvent.createMany({
    data: [
      {
        issueId: issueKitchen.id,
        type: "STATUS",
        toValue: "OPEN",
        note: "Created from QA failure",
        actorName: manager.name,
      },
      {
        issueId: issueKitchen.id,
        type: "STATUS",
        fromValue: "OPEN",
        toValue: "TRIAGED",
        note: "Confirmed photo framing issue",
        actorName: manager.name,
      },
      {
        issueId: issueKitchen.id,
        type: "ASSIGNMENT",
        toValue: sam.name,
        note: "Re-shoot assigned",
        actorName: manager.name,
      },
      {
        issueId: issueKitchen.id,
        type: "STATUS",
        fromValue: "TRIAGED",
        toValue: "ASSIGNED",
        note: "Status updated with assignment",
        actorName: manager.name,
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

  // Integrations catalog + demo connections (Prisma-only; sync exercised via UI/actions)
  const integrationDefs = [
    {
      provider: "AIRBNB",
      category: "BOOKING",
      name: "Airbnb",
      status: "CONNECTED",
      enabled: true,
      externalAccount: "airbnb-pacific-stay",
    },
    {
      provider: "VRBO",
      category: "BOOKING",
      name: "Vrbo",
      status: "ERROR",
      enabled: false,
      externalAccount: null as string | null,
      lastError: "OAuth token expired — reconnect required",
    },
    {
      provider: "DIRECT",
      category: "BOOKING",
      name: "Direct bookings",
      status: "DISCONNECTED",
      enabled: false,
      externalAccount: null as string | null,
    },
    {
      provider: "GOOGLE_CALENDAR",
      category: "CALENDAR",
      name: "Google Calendar",
      status: "CONNECTED",
      enabled: true,
      externalAccount: "ops@pacificstay.ops",
    },
    {
      provider: "OUTLOOK",
      category: "CALENDAR",
      name: "Outlook Calendar",
      status: "DISCONNECTED",
      enabled: false,
      externalAccount: null as string | null,
    },
    {
      provider: "EMAIL",
      category: "MESSAGING",
      name: "Email notifications",
      status: "CONNECTED",
      enabled: true,
      externalAccount: "alerts@pacificstay.ops",
    },
    {
      provider: "SMS",
      category: "MESSAGING",
      name: "SMS notifications",
      status: "DISCONNECTED",
      enabled: false,
      externalAccount: null as string | null,
    },
    {
      provider: "STORAGE",
      category: "STORAGE",
      name: "File storage",
      status: "CONNECTED",
      enabled: true,
      externalAccount: "s3://hostpitality-demo",
    },
  ];

  const createdIntegrations: Record<string, string> = {};
  for (const def of integrationDefs) {
    const row = await prisma.integration.create({
      data: {
        companyId: company.id,
        provider: def.provider,
        category: def.category,
        name: def.name,
        status: def.status,
        enabled: def.enabled,
        externalAccount: def.externalAccount,
        lastError: "lastError" in def ? (def as { lastError?: string }).lastError ?? null : null,
        connectedAt: def.status === "CONNECTED" ? now : null,
        disabledAt: def.status === "ERROR" ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : null,
        lastSyncAt:
          def.status === "CONNECTED" || def.status === "ERROR"
            ? new Date(now.getTime() - 60 * 60 * 1000)
            : null,
        lastSuccessAt: def.status === "CONNECTED" ? new Date(now.getTime() - 60 * 60 * 1000) : null,
        configJson: JSON.stringify({ seeded: true }),
      },
    });
    createdIntegrations[def.provider] = row.id;
  }

  await prisma.integrationSyncEvent.createMany({
    data: [
      {
        integrationId: createdIntegrations.AIRBNB,
        type: "SYNC",
        status: "SUCCESS",
        summary: "Synced Airbnb: 1 created, 0 updated, 0 skipped",
        recordsCreated: 1,
        detailJson: JSON.stringify({ fetched: 1 }),
        completedAt: now,
      },
      {
        integrationId: createdIntegrations.GOOGLE_CALENDAR,
        type: "SYNC",
        status: "SUCCESS",
        summary: "Synced Google Calendar: 2 created, 0 updated, 0 skipped",
        recordsCreated: 2,
        completedAt: now,
      },
      {
        integrationId: createdIntegrations.VRBO,
        type: "SYNC",
        status: "FAILED",
        summary: "Vrbo sync failed",
        error: "OAuth token expired — reconnect required",
        startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 5000),
      },
    ],
  });

  await prisma.integrationWebhookLog.createMany({
    data: [
      {
        companyId: company.id,
        integrationId: createdIntegrations.AIRBNB,
        eventType: "booking.created",
        externalId: "airbnb-1001",
        payloadJson: JSON.stringify({ guestName: "Guest Party" }),
        status: "PROCESSED",
        resultJson: JSON.stringify({ bookingExternalId: "airbnb-1001" }),
        processedAt: now,
      },
      {
        companyId: company.id,
        integrationId: createdIntegrations.EMAIL,
        eventType: "email.notify",
        payloadJson: JSON.stringify({ title: "Cleaner assignment updated" }),
        status: "PROCESSED",
        resultJson: JSON.stringify({ queued: true }),
        processedAt: now,
      },
    ],
  });

  await prisma.calendarEvent.createMany({
    data: [
      {
        companyId: company.id,
        integrationId: createdIntegrations.GOOGLE_CALENDAR,
        propertyId: propertyA.id,
        externalId: "gcal-SB-A1-block",
        title: `Owner hold · ${propertyA.name}`,
        startsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000),
        source: "GOOGLE_CALENDAR",
      },
      {
        companyId: company.id,
        integrationId: createdIntegrations.GOOGLE_CALENDAR,
        propertyId: propertyA.id,
        externalId: "gcal-SB-A1-turnover-window",
        title: `Checkout window · ${propertyA.unitCode}`,
        startsAt: todayMorning,
        endsAt: new Date(todayMorning.getTime() + 4 * 60 * 60 * 1000),
        source: "GOOGLE_CALENDAR",
        linkedTurnoverId: turnoverToday.id,
      },
    ],
  });

  const latestIssue = await prisma.issue.findFirst({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });
  if (latestIssue) {
    await prisma.storedFile.create({
      data: {
        companyId: company.id,
        integrationId: createdIntegrations.STORAGE,
        entityType: "Issue",
        entityId: latestIssue.id,
        filename: "vanity-crack.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 240000,
        storageKey: `${company.id}/Issue/${latestIssue.id}/vanity-crack.jpg`,
        url: `https://files.hostpitality.app/${company.id}/Issue/${latestIssue.id}/vanity-crack.jpg`,
        source: "ISSUE",
        label: "Issue photo",
      },
    });
  }
  await prisma.storedFile.create({
    data: {
      companyId: company.id,
      integrationId: createdIntegrations.STORAGE,
      entityType: "Turnover",
      entityId: turnoverToday.id,
      filename: "access-instructions.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128000,
      storageKey: `${company.id}/Turnover/${turnoverToday.id}/access-instructions.pdf`,
      url: `https://files.hostpitality.app/${company.id}/Turnover/${turnoverToday.id}/access-instructions.pdf`,
      source: "DOCUMENT",
      label: "Ops document",
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
