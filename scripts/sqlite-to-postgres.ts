#!/usr/bin/env tsx
/**
 * Non-destructive SQLite → PostgreSQL transfer helper.
 *
 * Reads SQLite with better-sqlite3 (Prisma schema is PostgreSQL-only).
 * Requires explicit --source and --target URLs. Never runs automatically.
 *
 * Session records are intentionally excluded: legacy Session.token values
 * must never be copied into the HMAC-only schema. Users re-authenticate.
 */
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { parseArgs } from "util";
import path from "path";
import fs from "fs";

const { values } = parseArgs({
  options: {
    source: { type: "string" },
    target: { type: "string" },
    confirm: { type: "string" },
  },
});

function assertSafeTarget(url: string) {
  const lower = url.toLowerCase();
  const looksProtected =
    lower.includes("production") ||
    lower.includes("staging") ||
    lower.includes(".prod.") ||
    lower.includes("-prod.") ||
    lower.includes("prod-") ||
    /[/_-]prod(?:[/_-]|$)/.test(lower) ||
    /\/\/[^/]*\bprod\b/.test(lower);

  if (looksProtected && values.confirm !== "TRANSFER_TO_TARGET") {
    throw new Error("Staging/production transfer requires --confirm=TRANSFER_TO_TARGET");
  }
}

/** Dependency-safe order. Session intentionally omitted. */
const TABLE_ORDER = [
  "Company",
  "User",
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

function sqlitePathFromUrl(source: string): string {
  if (!source.startsWith("file:")) {
    throw new Error("Source must be a SQLite file: URL");
  }
  const raw = source.slice("file:".length);
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function modelKey(table: string) {
  return table.charAt(0).toLowerCase() + table.slice(1);
}

const BOOLEAN_FIELDS = new Set([
  "active",
  "sameDayTurnover",
  "enabled",
  "blocking",
  "completed",
  "requiresPhoto",
  "required",
  "uploaded",
  "overrideIncomplete",
]);

function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (
      typeof v === "number" &&
      (k.endsWith("At") ||
        k === "checkIn" ||
        k === "checkOut" ||
        k === "runAt" ||
        k === "windowStart" ||
        k === "windowEnd" ||
        k === "deadlineAt" ||
        k === "unavailableUntil" ||
        k === "dueAt" ||
        k === "startsAt" ||
        k === "endsAt")
    ) {
      out[k] = v ? new Date(v) : null;
    } else if (BOOLEAN_FIELDS.has(k) && (v === 0 || v === 1)) {
      out[k] = Boolean(v);
    } else if (typeof v === "bigint") {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  }
  delete out.token;
  return out;
}

async function main() {
  const source = values.source;
  const target = values.target;
  if (!source || !target) {
    throw new Error(
      "Usage: tsx scripts/sqlite-to-postgres.ts --source file:./tmp/source.db --target postgresql://..."
    );
  }
  if (!target.startsWith("postgresql://") && !target.startsWith("postgres://")) {
    throw new Error("Target must be a PostgreSQL URL");
  }
  assertSafeTarget(target);

  const filePath = sqlitePathFromUrl(source);
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQLite source not found: ${filePath}`);
  }

  const sqlite = new Database(filePath, { readonly: true, fileMustExist: true });
  const postgres = new PrismaClient({ datasources: { db: { url: target } } });

  const counts: Record<string, { source: number; target: number; skipped?: string }> = {};
  counts.Session = {
    source: (() => {
      try {
        return (sqlite.prepare(`SELECT COUNT(*) as c FROM Session`).get() as { c: number }).c;
      } catch {
        return 0;
      }
    })(),
    target: 0,
    skipped: "Sessions excluded — users must re-authenticate (no raw token transfer)",
  };

  for (const table of TABLE_ORDER) {
    let sourceCount = 0;
    try {
      sourceCount = (sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c;
    } catch {
      counts[table] = { source: 0, target: 0, skipped: "table missing in source" };
      continue;
    }

    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
    const key = modelKey(table);
    const targetModel = (postgres as unknown as Record<
      string,
      { createMany: (args: object) => Promise<unknown>; count: () => Promise<number> }
    >)[key];

    if (!targetModel?.createMany) {
      counts[table] = { source: sourceCount, target: 0, skipped: "no prisma model" };
      continue;
    }

    if (rows.length) {
      const data = rows.map(coerceRow);
      // Insert in chunks to avoid parameter limits
      const chunk = 100;
      for (let i = 0; i < data.length; i += chunk) {
        await targetModel.createMany({ data: data.slice(i, i + chunk), skipDuplicates: true });
      }
    }

    counts[table] = { source: sourceCount, target: await targetModel.count() };
  }

  // FK orphan checks for core relationships
  const orphans = {
    propertyWithoutCompany: await postgres.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*)::bigint AS c FROM "Property" p LEFT JOIN "Company" c ON c.id = p."companyId" WHERE c.id IS NULL`
    ),
    turnoverWithoutProperty: await postgres.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*)::bigint AS c FROM "Turnover" t LEFT JOIN "Property" p ON p.id = t."propertyId" WHERE p.id IS NULL`
    ),
    issueCompanyMismatch: await postgres.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT COUNT(*)::bigint AS c FROM "Issue" i JOIN "Property" p ON p.id = i."propertyId" WHERE i."companyId" <> p."companyId"`
    ),
  };

  const report = {
    ok: true,
    counts,
    orphans: {
      propertyWithoutCompany: Number(orphans.propertyWithoutCompany[0]?.c ?? 0),
      turnoverWithoutProperty: Number(orphans.turnoverWithoutProperty[0]?.c ?? 0),
      issueCompanyMismatch: Number(orphans.issueCompanyMismatch[0]?.c ?? 0),
    },
    sessionPolicy:
      "Legacy Session rows were not transferred. Re-authentication required after cutover.",
  };

  if (
    report.orphans.propertyWithoutCompany ||
    report.orphans.turnoverWithoutProperty ||
    report.orphans.issueCompanyMismatch
  ) {
    report.ok = false;
  }

  // Row-count reconciliation (excluding Session)
  for (const table of TABLE_ORDER) {
    const c = counts[table];
    if (!c || c.skipped) continue;
    if (c.source !== c.target) {
      report.ok = false;
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;

  sqlite.close();
  await postgres.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
