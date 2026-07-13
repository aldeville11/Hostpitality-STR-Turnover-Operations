#!/usr/bin/env tsx
/**
 * Non-destructive SQLite → PostgreSQL transfer helper.
 * Requires explicit --source and --target URLs. Never runs automatically.
 */
import { PrismaClient } from "@prisma/client";
import { parseArgs } from "util";

const { values } = parseArgs({
  options: {
    source: { type: "string" },
    target: { type: "string" },
    confirm: { type: "string" },
  },
});

function assertSafeTarget(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("production") || lower.includes("staging") || lower.includes("prod")) {
    if (values.confirm !== "TRANSFER_TO_TARGET") {
      throw new Error("Staging/production transfer requires --confirm=TRANSFER_TO_TARGET");
    }
  }
}

const TABLE_ORDER = [
  "Company",
  "User",
  "Session",
  "Vendor",
  "Sop",
  "SopVersion",
  "Sow",
  "SowVersion",
  "Property",
  "Booking",
  "Turnover",
  "TurnoverChecklistItem",
  "TurnoverStatusEvent",
  "TurnoverAssignmentEvent",
  "QaInspection",
  "QaInspectionItem",
  "QaPhotoReview",
  "QaInspectionEvent",
  "Issue",
  "IssueComment",
  "IssueEvent",
  "InventoryItem",
  "Notification",
  "AuditLog",
  "BackgroundJob",
  "Integration",
  "IntegrationSyncEvent",
  "IntegrationWebhookLog",
  "CalendarEvent",
  "StoredFile",
] as const;

async function main() {
  const source = values.source;
  const target = values.target;
  if (!source || !target) {
    throw new Error("Usage: tsx scripts/sqlite-to-postgres.ts --source file:./dev.db --target postgresql://...");
  }
  if (!source.startsWith("file:")) {
    throw new Error("Source must be a SQLite file: URL");
  }
  assertSafeTarget(target);

  const sqlite = new PrismaClient({ datasources: { db: { url: source } } });
  const postgres = new PrismaClient({ datasources: { db: { url: target } } });

  const counts: Record<string, { source: number; target: number }> = {};

  for (const table of TABLE_ORDER) {
    const model = (sqlite as unknown as Record<string, { findMany: () => Promise<{ id: string }[]> }>)[
      table.charAt(0).toLowerCase() + table.slice(1)
    ];
    const targetModel = (postgres as unknown as Record<string, { createMany: (args: object) => Promise<unknown>; count: () => Promise<number> }>)[
      table.charAt(0).toLowerCase() + table.slice(1)
    ];
    if (!model?.findMany || !targetModel?.createMany) continue;

    const rows = await model.findMany();
    counts[table] = { source: rows.length, target: 0 };
    if (rows.length === 0) continue;

    await targetModel.createMany({ data: rows, skipDuplicates: true });
    counts[table].target = await targetModel.count();
  }

  console.log(JSON.stringify({ ok: true, counts }, null, 2));

  await sqlite.$disconnect();
  await postgres.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
