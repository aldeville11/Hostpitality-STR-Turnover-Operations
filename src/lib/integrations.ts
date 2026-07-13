import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { validateEntityOwnership } from "./tenant";
import { parseJson } from "./json";
import { enqueueJob } from "./jobs";

type CreateTurnoverInput = {
  companyId: string;
  userId: string;
  propertyId: string;
  bookingId?: string;
  priority?: string;
  notes?: string;
  actorName?: string;
};

async function createTurnoverFromBookingSafe(input: CreateTurnoverInput) {
  const { createTurnoverFromBooking } = await import("./turnovers");
  return createTurnoverFromBooking(input);
}

export const INTEGRATION_PROVIDERS = [
  "AIRBNB",
  "VRBO",
  "DIRECT",
  "GOOGLE_CALENDAR",
  "OUTLOOK",
  "EMAIL",
  "SMS",
  "STORAGE",
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_CATEGORIES = [
  "BOOKING",
  "CALENDAR",
  "MESSAGING",
  "STORAGE",
] as const;
export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export const INTEGRATION_CATALOG: Array<{
  provider: IntegrationProvider;
  category: IntegrationCategory;
  name: string;
  description: string;
}> = [
  {
    provider: "AIRBNB",
    category: "BOOKING",
    name: "Airbnb",
    description: "Sync Airbnb reservations into turnovers.",
  },
  {
    provider: "VRBO",
    category: "BOOKING",
    name: "Vrbo",
    description: "Sync Vrbo reservations and cancellations.",
  },
  {
    provider: "DIRECT",
    category: "BOOKING",
    name: "Direct bookings",
    description: "Import direct / PMS channel reservations.",
  },
  {
    provider: "GOOGLE_CALENDAR",
    category: "CALENDAR",
    name: "Google Calendar",
    description: "Import Google Calendar events alongside scheduling.",
  },
  {
    provider: "OUTLOOK",
    category: "CALENDAR",
    name: "Outlook Calendar",
    description: "Import Outlook calendar events for turnover windows.",
  },
  {
    provider: "EMAIL",
    category: "MESSAGING",
    name: "Email notifications",
    description: "Deliver assignment, QA, and issue updates by email.",
  },
  {
    provider: "SMS",
    category: "MESSAGING",
    name: "SMS notifications",
    description: "SMS hooks for urgent field updates.",
  },
  {
    provider: "STORAGE",
    category: "STORAGE",
    name: "File storage",
    description: "Store QA photos, issue photos, and operational documents.",
  },
];

export function integrationStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  switch (status) {
    case "CONNECTED":
      return "success";
    case "SYNCING":
      return "info";
    case "ERROR":
      return "danger";
    case "DISABLED":
      return "warning";
    default:
      return "neutral";
  }
}

export function formatSyncTime(value: Date | string | null | undefined) {
  if (!value) return "Never";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type NormalizedBooking = {
  externalId: string;
  propertyUnitCode?: string;
  propertyId?: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  status: "CONFIRMED" | "CANCELLED" | "CHANGED";
  source: string;
};

type NormalizedCalendarEvent = {
  externalId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  propertyUnitCode?: string;
};

function catalogEntry(provider: string) {
  return INTEGRATION_CATALOG.find((c) => c.provider === provider);
}

export async function ensureIntegrations(companyId: string) {
  for (const item of INTEGRATION_CATALOG) {
    await prisma.integration.upsert({
      where: {
        companyId_provider: { companyId, provider: item.provider },
      },
      create: {
        companyId,
        provider: item.provider,
        category: item.category,
        name: item.name,
        status: "DISCONNECTED",
        enabled: false,
        configJson: JSON.stringify({ description: item.description }),
      },
      update: {
        name: item.name,
        category: item.category,
      },
    });
  }
}

export async function listIntegrations(companyId: string) {
  await ensureIntegrations(companyId);
  const integrations = await prisma.integration.findMany({
    where: { companyId },
    include: {
      syncEvents: { orderBy: { startedAt: "desc" }, take: 1 },
      _count: {
        select: { webhookLogs: true, syncEvents: true, storedFiles: true, calendarEvents: true },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return integrations.map((i) => ({
    ...i,
    config: parseJson<Record<string, unknown>>(i.configJson, {}),
    catalog: catalogEntry(i.provider),
  }));
}

export async function getIntegrationDetail(companyId: string, id: string) {
  await ensureIntegrations(companyId);
  const integration = await prisma.integration.findFirst({
    where: { id, companyId },
    include: {
      syncEvents: { orderBy: { startedAt: "desc" }, take: 20 },
      webhookLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      calendarEvents: { orderBy: { startsAt: "desc" }, take: 20 },
      storedFiles: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!integration) return null;

  const properties = await prisma.property.findMany({
    where: { companyId, active: true },
    select: { id: true, name: true, unitCode: true, bookingSource: true, calendarStatus: true },
    orderBy: { name: "asc" },
  });

  return {
    integration: {
      ...integration,
      config: parseJson<Record<string, unknown>>(integration.configJson, {}),
      catalog: catalogEntry(integration.provider),
    },
    properties,
  };
}

export async function connectIntegration(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  integrationId: string;
  externalAccount?: string;
  config?: Record<string, unknown>;
}) {
  const integration = await prisma.integration.findFirst({
    where: { id: input.integrationId, companyId: input.companyId },
  });
  if (!integration) throw new Error("Integration not found");

  const config = {
    ...parseJson<Record<string, unknown>>(integration.configJson, {}),
    ...(input.config ?? {}),
  };

  const updated = await prisma.integration.update({
    where: { id: integration.id },
    data: {
      status: "CONNECTED",
      enabled: true,
      externalAccount: input.externalAccount?.trim() || `${integration.provider.toLowerCase()}@hostpitality.app`,
      connectedAt: new Date(),
      disabledAt: null,
      lastError: null,
      configJson: JSON.stringify(config),
    },
  });

  await prisma.integrationSyncEvent.create({
    data: {
      integrationId: integration.id,
      type: "RECONNECT",
      status: "SUCCESS",
      summary: `Connected ${integration.name}`,
      completedAt: new Date(),
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "integration.connected",
    entityType: "Integration",
    entityId: integration.id,
    metadata: { provider: integration.provider },
  });

  return updated;
}

export async function setIntegrationEnabled(input: {
  companyId: string;
  userId: string;
  integrationId: string;
  enabled: boolean;
}) {
  const integration = await prisma.integration.findFirst({
    where: { id: input.integrationId, companyId: input.companyId },
  });
  if (!integration) throw new Error("Integration not found");

  const updated = await prisma.integration.update({
    where: { id: integration.id },
    data: {
      enabled: input.enabled,
      status: input.enabled
        ? integration.status === "DISABLED"
          ? "CONNECTED"
          : integration.status === "DISCONNECTED"
            ? "CONNECTED"
            : integration.status
        : "DISABLED",
      disabledAt: input.enabled ? null : new Date(),
      connectedAt: input.enabled ? integration.connectedAt ?? new Date() : integration.connectedAt,
      lastError: input.enabled ? null : integration.lastError,
    },
  });

  await prisma.integrationSyncEvent.create({
    data: {
      integrationId: integration.id,
      type: input.enabled ? "ENABLE" : "DISABLE",
      status: "SUCCESS",
      summary: input.enabled ? `Enabled ${integration.name}` : `Disabled ${integration.name}`,
      completedAt: new Date(),
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: input.enabled ? "integration.enabled" : "integration.disabled",
    entityType: "Integration",
    entityId: integration.id,
  });

  return updated;
}

function mockBookingPayloads(
  provider: IntegrationProvider,
  properties: Array<{ id: string; unitCode: string }>
): NormalizedBooking[] {
  if (!properties.length) return [];
  const primary = properties[0];
  const secondary = properties[1] ?? properties[0];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (provider === "AIRBNB") {
    return [
      {
        externalId: `airbnb-${primary.unitCode}-new`,
        propertyId: primary.id,
        guestName: "Airbnb Guest Rivera",
        checkIn: new Date(now + 2 * day),
        checkOut: new Date(now + 5 * day),
        status: "CONFIRMED",
        source: "airbnb",
      },
      {
        externalId: `airbnb-${secondary.unitCode}-chg`,
        propertyId: secondary.id,
        guestName: "Airbnb Guest Chang",
        checkIn: new Date(now + 6 * day),
        checkOut: new Date(now + 9 * day + 2 * 60 * 60 * 1000),
        status: "CHANGED",
        source: "airbnb",
      },
    ];
  }

  if (provider === "VRBO") {
    return [
      {
        externalId: `vrbo-${primary.unitCode}-1`,
        propertyId: primary.id,
        guestName: "Vrbo Guest Patel",
        checkIn: new Date(now + 3 * day),
        checkOut: new Date(now + 7 * day),
        status: "CONFIRMED",
        source: "vrbo",
      },
      {
        externalId: `vrbo-${secondary.unitCode}-cancel`,
        propertyId: secondary.id,
        guestName: "Vrbo Guest Cancelled",
        checkIn: new Date(now + 1 * day),
        checkOut: new Date(now + 4 * day),
        status: "CANCELLED",
        source: "vrbo",
      },
    ];
  }

  return [
    {
      externalId: `direct-${primary.unitCode}-1`,
      propertyId: primary.id,
      guestName: "Direct Guest Chen",
      checkIn: new Date(now + 8 * day),
      checkOut: new Date(now + 11 * day),
      status: "CONFIRMED",
      source: "direct",
    },
  ];
}

function mockCalendarEvents(
  provider: IntegrationProvider,
  properties: Array<{ id: string; unitCode: string; name: string }>
): NormalizedCalendarEvent[] {
  if (!properties.length) return [];
  const p = properties[0];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const prefix = provider === "GOOGLE_CALENDAR" ? "gcal" : "outlook";
  return [
    {
      externalId: `${prefix}-${p.unitCode}-block`,
      title: `Owner hold · ${p.name}`,
      startsAt: new Date(now + 14 * day),
      endsAt: new Date(now + 16 * day),
      propertyUnitCode: p.unitCode,
    },
    {
      externalId: `${prefix}-${p.unitCode}-turnover-window`,
      title: `Checkout window · ${p.unitCode}`,
      startsAt: new Date(now + 5 * day + 11 * 60 * 60 * 1000),
      endsAt: new Date(now + 5 * day + 15 * 60 * 60 * 1000),
      propertyUnitCode: p.unitCode,
    },
  ];
}

async function upsertNormalizedBooking(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  booking: NormalizedBooking;
  integrationId: string;
}) {
  const property = input.booking.propertyId
    ? await prisma.property.findFirst({
        where: { id: input.booking.propertyId, companyId: input.companyId },
      })
    : input.booking.propertyUnitCode
      ? await prisma.property.findFirst({
          where: {
            companyId: input.companyId,
            unitCode: input.booking.propertyUnitCode,
          },
        })
      : null;
  if (!property) return { skipped: true as const, reason: "property_not_found" };

  const existing = await prisma.booking.findFirst({
    where: {
      propertyId: property.id,
      externalId: input.booking.externalId,
    },
    include: { turnover: true },
  });

  if (input.booking.status === "CANCELLED") {
    if (!existing) {
      await prisma.integrationWebhookLog.create({
        data: {
          companyId: input.companyId,
          integrationId: input.integrationId,
          eventType: "booking.cancelled",
          externalId: input.booking.externalId,
          payloadJson: JSON.stringify(input.booking),
          status: "IGNORED",
          resultJson: JSON.stringify({ reason: "unknown_booking" }),
          processedAt: new Date(),
        },
      });
      return { skipped: true as const, reason: "unknown_cancelled" };
    }

    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        lastSyncedAt: new Date(),
        guestName: input.booking.guestName,
        checkIn: input.booking.checkIn,
        checkOut: input.booking.checkOut,
      },
    });

    if (
      existing.turnover &&
      !["COMPLETED", "CANCELLED"].includes(existing.turnover.status)
    ) {
      await prisma.turnover.update({
        where: { id: existing.turnover.id },
        data: { status: "CANCELLED", notes: "Cancelled via booking source sync" },
      });
      await prisma.turnoverStatusEvent.create({
        data: {
          turnoverId: existing.turnover.id,
          fromStatus: existing.turnover.status,
          toStatus: "CANCELLED",
          note: "Booking cancelled by channel sync",
          actorId: input.userId,
          actorName: input.actorName ?? "integration",
        },
      });
    }

    await prisma.integrationWebhookLog.create({
      data: {
        companyId: input.companyId,
        integrationId: input.integrationId,
        eventType: "booking.cancelled",
        externalId: input.booking.externalId,
        payloadJson: JSON.stringify(input.booking),
        status: "PROCESSED",
        resultJson: JSON.stringify({ bookingId: existing.id }),
        processedAt: new Date(),
      },
    });

    return { updated: true as const, bookingId: existing.id, cancelled: true as const };
  }

  if (existing) {
    const changed =
      existing.checkOut.getTime() !== input.booking.checkOut.getTime() ||
      existing.checkIn.getTime() !== input.booking.checkIn.getTime() ||
      existing.guestName !== input.booking.guestName ||
      input.booking.status === "CHANGED";

    await prisma.booking.update({
      where: { id: existing.id },
      data: {
        guestName: input.booking.guestName,
        checkIn: input.booking.checkIn,
        checkOut: input.booking.checkOut,
        source: input.booking.source,
        status: "CONFIRMED",
        cancelledAt: null,
        lastSyncedAt: new Date(),
      },
    });

    if (changed && existing.turnover && existing.turnover.status !== "CANCELLED") {
      const buffer = property.turnoverBufferMins ?? 60;
      const windowStart = new Date(input.booking.checkOut.getTime() + buffer * 60 * 1000);
      const windowEnd = new Date(windowStart.getTime() + 4 * 60 * 60 * 1000);
      await prisma.turnover.update({
        where: { id: existing.turnover.id },
        data: {
          windowStart,
          windowEnd,
          deadlineAt: windowEnd,
          notes: `Updated from ${input.booking.source} booking change`,
        },
      });
    }

    await prisma.integrationWebhookLog.create({
      data: {
        companyId: input.companyId,
        integrationId: input.integrationId,
        eventType: changed ? "booking.changed" : "booking.unchanged",
        externalId: input.booking.externalId,
        payloadJson: JSON.stringify(input.booking),
        status: "PROCESSED",
        resultJson: JSON.stringify({ bookingId: existing.id, changed }),
        processedAt: new Date(),
      },
    });

    // Ensure turnover exists for active booking
    if (!existing.turnover) {
      const created = await createTurnoverFromBookingSafe({
        companyId: input.companyId,
        userId: input.userId,
        propertyId: property.id,
        bookingId: existing.id,
        actorName: input.actorName,
        notes: `Created from ${input.booking.source} sync`,
      });
      return {
        updated: true as const,
        bookingId: existing.id,
        turnoverId: created.turnoverId,
        createdTurnover: created.created,
      };
    }

    return { updated: true as const, bookingId: existing.id, changed };
  }

  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      externalId: input.booking.externalId,
      guestName: input.booking.guestName,
      checkIn: input.booking.checkIn,
      checkOut: input.booking.checkOut,
      source: input.booking.source,
      status: "CONFIRMED",
      lastSyncedAt: new Date(),
    },
  });

  const created = await createTurnoverFromBookingSafe({
    companyId: input.companyId,
    userId: input.userId,
    propertyId: property.id,
    bookingId: booking.id,
    actorName: input.actorName,
    notes: `Created from ${input.booking.source} sync`,
  });

  await prisma.integrationWebhookLog.create({
    data: {
      companyId: input.companyId,
      integrationId: input.integrationId,
      eventType: "booking.created",
      externalId: input.booking.externalId,
      payloadJson: JSON.stringify(input.booking),
      status: "PROCESSED",
      resultJson: JSON.stringify({
        bookingId: booking.id,
        turnoverId: created.turnoverId,
      }),
      processedAt: new Date(),
    },
  });

  return {
    created: true as const,
    bookingId: booking.id,
    turnoverId: created.turnoverId,
  };
}

async function syncBookingProvider(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  integration: { id: string; provider: string; name: string };
}) {
  const properties = await prisma.property.findMany({
    where: { companyId: input.companyId, active: true },
    select: { id: true, unitCode: true, name: true },
    orderBy: { name: "asc" },
  });

  const payloads = mockBookingPayloads(
    input.integration.provider as IntegrationProvider,
    properties
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const booking of payloads) {
    const result = await upsertNormalizedBooking({
      companyId: input.companyId,
      userId: input.userId,
      actorName: input.actorName,
      booking,
      integrationId: input.integration.id,
    });
    if ("created" in result && result.created) created += 1;
    else if ("updated" in result && result.updated) updated += 1;
    else skipped += 1;
  }

  // Mark property booking sources when connected
  if (properties[0]) {
    await prisma.property.update({
      where: { id: properties[0].id },
      data: {
        bookingSource: input.integration.provider.toLowerCase(),
        calendarStatus: "synced",
        calendarSyncedAt: new Date(),
      },
    });
  }

  return { created, updated, skipped, fetched: payloads.length };
}

async function syncCalendarProvider(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  integration: { id: string; provider: string; name: string };
}) {
  const properties = await prisma.property.findMany({
    where: { companyId: input.companyId, active: true },
    select: { id: true, unitCode: true, name: true, turnoverBufferMins: true },
    orderBy: { name: "asc" },
  });

  const events = mockCalendarEvents(
    input.integration.provider as IntegrationProvider,
    properties
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const property = event.propertyUnitCode
      ? properties.find((p) => p.unitCode === event.propertyUnitCode)
      : properties[0];

    const existing = await prisma.calendarEvent.findUnique({
      where: {
        integrationId_externalId: {
          integrationId: input.integration.id,
          externalId: event.externalId,
        },
      },
    });

    if (existing) {
      await prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          propertyId: property?.id ?? null,
          rawJson: JSON.stringify(event),
        },
      });
      updated += 1;
      continue;
    }

    // Prevent duplicate turnover creation for checkout-window style events
    // by only creating a booking/turnover when no overlapping booking exists.
    let linkedTurnoverId: string | null = null;
    if (property && /checkout|turnover/i.test(event.title)) {
      const overlapping = await prisma.booking.findFirst({
        where: {
          propertyId: property.id,
          status: { not: "CANCELLED" },
          checkOut: {
            gte: new Date(event.startsAt.getTime() - 12 * 60 * 60 * 1000),
            lte: new Date(event.endsAt.getTime() + 12 * 60 * 60 * 1000),
          },
        },
        include: { turnover: true },
      });

      if (overlapping?.turnover) {
        linkedTurnoverId = overlapping.turnover.id;
        skipped += 1;
      } else if (!overlapping) {
        const booking = await prisma.booking.create({
          data: {
            propertyId: property.id,
            externalId: `cal-${event.externalId}`,
            guestName: "Calendar import",
            checkIn: new Date(event.startsAt.getTime() - 3 * 24 * 60 * 60 * 1000),
            checkOut: event.startsAt,
            source: input.integration.provider.toLowerCase(),
            status: "CONFIRMED",
            lastSyncedAt: new Date(),
          },
        });
        const createdTurnover = await createTurnoverFromBookingSafe({
          companyId: input.companyId,
          userId: input.userId,
          propertyId: property.id,
          bookingId: booking.id,
          actorName: input.actorName,
          notes: `Created from ${input.integration.name} event (deduped by external calendar id)`,
        });
        linkedTurnoverId = createdTurnover.turnoverId;
      }
    }

    await prisma.calendarEvent.create({
      data: {
        companyId: input.companyId,
        integrationId: input.integration.id,
        propertyId: property?.id ?? null,
        externalId: event.externalId,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        source: input.integration.provider,
        linkedTurnoverId,
        rawJson: JSON.stringify(event),
      },
    });
    created += 1;
  }

  if (properties[0]) {
    await prisma.property.update({
      where: { id: properties[0].id },
      data: {
        calendarStatus: "synced",
        calendarSyncedAt: new Date(),
        calendarUrl:
          input.integration.provider === "GOOGLE_CALENDAR"
            ? "https://calendar.google.com/calendar/ical/demo/public/basic.ics"
            : "https://outlook.office365.com/owa/calendar/demo/calendar.ics",
      },
    });
  }

  return { created, updated, skipped, fetched: events.length };
}

async function syncMessagingProvider(input: {
  companyId: string;
  integration: { id: string; provider: string; name: string };
}) {
  const channel = input.integration.provider === "SMS" ? "sms" : "email";
  const job = await enqueueJob({
    companyId: input.companyId,
    type: "notification.dispatch",
    payload: {
      title: `${input.integration.name} connected`,
      body: `Test ${channel} delivery from Hostpitality integrations.`,
      type: `integration.${channel}`,
      channel,
    },
  });

  await prisma.integrationWebhookLog.create({
    data: {
      companyId: input.companyId,
      integrationId: input.integration.id,
      eventType: `${channel}.test`,
      payloadJson: JSON.stringify({ jobId: job.id }),
      status: "PROCESSED",
      resultJson: JSON.stringify({ queued: true, jobId: job.id }),
      processedAt: new Date(),
    },
  });

  return { created: 1, updated: 0, skipped: 0, fetched: 1 };
}

async function syncStorageProvider(input: {
  companyId: string;
  integration: { id: string; provider: string; name: string };
}) {
  const samples = [
    {
      entityType: "QaInspection",
      filename: "kitchen-wide.jpg",
      label: "QA photo",
      source: "QA",
      mimeType: "image/jpeg",
    },
    {
      entityType: "Issue",
      filename: "vanity-crack.jpg",
      label: "Issue photo",
      source: "ISSUE",
      mimeType: "image/jpeg",
    },
    {
      entityType: "Turnover",
      filename: "access-instructions.pdf",
      label: "Ops document",
      source: "DOCUMENT",
      mimeType: "application/pdf",
    },
  ];

  let created = 0;
  let skipped = 0;

  const issue = await prisma.issue.findFirst({
    where: { companyId: input.companyId },
    orderBy: { createdAt: "desc" },
  });
  const turnover = await prisma.turnover.findFirst({
    where: { companyId: input.companyId },
    orderBy: { createdAt: "desc" },
  });
  const inspection = await prisma.qaInspection.findFirst({
    where: { companyId: input.companyId },
    orderBy: { createdAt: "desc" },
  });

  for (const sample of samples) {
    const entityId =
      sample.entityType === "Issue"
        ? issue?.id
        : sample.entityType === "QaInspection"
          ? inspection?.id
          : turnover?.id;
    if (!entityId) {
      skipped += 1;
      continue;
    }

    const storageKey = `${input.companyId}/${sample.entityType}/${entityId}/${sample.filename}`;
    const existing = await prisma.storedFile.findFirst({
      where: { companyId: input.companyId, storageKey },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.storedFile.create({
      data: {
        companyId: input.companyId,
        integrationId: input.integration.id,
        entityType: sample.entityType,
        entityId,
        filename: sample.filename,
        mimeType: sample.mimeType,
        sizeBytes: 240_000,
        storageKey,
        url: `https://files.hostpitality.app/${storageKey}`,
        source: sample.source,
        label: sample.label,
      },
    });
    created += 1;
  }

  return { created, updated: 0, skipped, fetched: samples.length };
}

export async function runIntegrationSync(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  integrationId: string;
}) {
  const integration = await prisma.integration.findFirst({
    where: { id: input.integrationId, companyId: input.companyId },
  });
  if (!integration) throw new Error("Integration not found");
  if (!integration.enabled && integration.status !== "CONNECTED") {
    throw new Error("Connect and enable this integration before syncing");
  }
  if (integration.status === "DISABLED") {
    throw new Error("Integration is disabled");
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { status: "SYNCING", lastError: null },
  });

  const startedAt = new Date();
  try {
    let stats = { created: 0, updated: 0, skipped: 0, fetched: 0 };
    if (integration.category === "BOOKING") {
      stats = await syncBookingProvider({
        companyId: input.companyId,
        userId: input.userId,
        actorName: input.actorName,
        integration,
      });
    } else if (integration.category === "CALENDAR") {
      stats = await syncCalendarProvider({
        companyId: input.companyId,
        userId: input.userId,
        actorName: input.actorName,
        integration,
      });
    } else if (integration.category === "MESSAGING") {
      stats = await syncMessagingProvider({
        companyId: input.companyId,
        integration,
      });
    } else if (integration.category === "STORAGE") {
      stats = await syncStorageProvider({
        companyId: input.companyId,
        integration,
      });
    }

    const event = await prisma.integrationSyncEvent.create({
      data: {
        integrationId: integration.id,
        type: "SYNC",
        status: "SUCCESS",
        summary: `Synced ${integration.name}: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`,
        detailJson: JSON.stringify(stats),
        recordsCreated: stats.created,
        recordsUpdated: stats.updated,
        recordsSkipped: stats.skipped,
        startedAt,
        completedAt: new Date(),
      },
    });

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: "CONNECTED",
        enabled: true,
        lastSyncAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
        syncCursor: event.id,
      },
    });

    await writeAuditLog({
      companyId: input.companyId,
      userId: input.userId,
      action: "integration.synced",
      entityType: "Integration",
      entityId: integration.id,
      metadata: stats,
    });

    return { ok: true as const, stats, eventId: event.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    await prisma.integrationSyncEvent.create({
      data: {
        integrationId: integration.id,
        type: "SYNC",
        status: "FAILED",
        summary: `Sync failed for ${integration.name}`,
        error: message,
        startedAt,
        completedAt: new Date(),
      },
    });
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: "ERROR", lastSyncAt: new Date(), lastError: message },
    });
    throw err;
  }
}

/** Messaging hook used by operational workflows without replacing them. */
export async function notifyViaIntegrations(input: {
  companyId: string;
  title: string;
  body: string;
  type: string;
  userId?: string | null;
  channels?: Array<"EMAIL" | "SMS">;
}) {
  const channels = input.channels ?? ["EMAIL", "SMS"];
  const integrations = await prisma.integration.findMany({
    where: {
      companyId: input.companyId,
      provider: { in: channels },
      enabled: true,
      status: { in: ["CONNECTED", "SYNCING"] },
    },
  });

  const jobs = [];
  for (const integration of integrations) {
    const channel = integration.provider === "SMS" ? "sms" : "email";
    const job = await enqueueJob({
      companyId: input.companyId,
      type: "notification.dispatch",
      payload: {
        title: input.title,
        body: input.body,
        type: input.type,
        userId: input.userId ?? null,
        channel,
        integrationId: integration.id,
      },
    });
    await prisma.integrationWebhookLog.create({
      data: {
        companyId: input.companyId,
        integrationId: integration.id,
        eventType: `${channel}.notify`,
        payloadJson: JSON.stringify({
          title: input.title,
          body: input.body,
          type: input.type,
        }),
        status: "PROCESSED",
        resultJson: JSON.stringify({ jobId: job.id }),
        processedAt: new Date(),
      },
    });
    jobs.push(job.id);
  }
  return { queued: jobs.length, jobIds: jobs };
}

export async function listFilesForEntity(input: {
  companyId: string;
  entityType: string;
  entityId: string;
}) {
  await validateEntityOwnership(input.companyId, input.entityType, input.entityId);
  return prisma.storedFile.findMany({
    where: {
      companyId: input.companyId,
      entityType: input.entityType,
      entityId: input.entityId,
    },
    include: { integration: { select: { id: true, name: true, provider: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function attachStoredFile(input: {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  filename: string;
  label?: string;
  source?: string;
  mimeType?: string;
}) {
  const storage = await prisma.integration.findFirst({
    where: {
      companyId: input.companyId,
      provider: "STORAGE",
      enabled: true,
      status: { in: ["CONNECTED", "SYNCING"] },
    },
  });
  if (!storage) throw new Error("Connect and enable file storage first");

  await validateEntityOwnership(input.companyId, input.entityType, input.entityId);

  const safeName = input.filename.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `${input.companyId}/${input.entityType}/${input.entityId}/${Date.now()}-${safeName}`;
  const file = await prisma.storedFile.create({
    data: {
      companyId: input.companyId,
      integrationId: storage.id,
      entityType: input.entityType,
      entityId: input.entityId,
      filename: safeName,
      mimeType: input.mimeType ?? "application/octet-stream",
      sizeBytes: 128_000,
      storageKey,
      url: `https://files.hostpitality.app/${storageKey}`,
      source: input.source ?? "UPLOAD",
      label: input.label ?? safeName,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "integration.file_attached",
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: { fileId: file.id, storageKey },
  });

  return file;
}

export type IntegrationListItem = Awaited<ReturnType<typeof listIntegrations>>[number];
export type IntegrationDetailPayload = NonNullable<
  Awaited<ReturnType<typeof getIntegrationDetail>>
>;
