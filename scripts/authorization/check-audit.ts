/**
 * Authorization inventory coverage check.
 * Proves discoverable symbols match the audit CSV — not behavioral correctness.
 */
import fs from "fs";
import path from "path";
import { discoverAuthSurfaces, discoverApiMethodIds, discoverServerActionIds } from "./discover";

const ROOT = path.resolve(__dirname, "../..");
const CSV_PATH = path.join(ROOT, "docs/audits/tenant-isolation.csv");

const REQUIRED_STATUSES = new Set([
  "Verified safe",
  "Fixed",
  "Removed",
  "Not tenant-owned",
  "Unresolved",
]);

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export type AuditCheckResult = { ok: boolean; errors: string[]; stats: Record<string, number> };

export function checkAuthorizationAudit(): AuditCheckResult {
  const errors: string[] = [];
  if (!fs.existsSync(CSV_PATH)) {
    return { ok: false, errors: [`Missing ${CSV_PATH}`], stats: {} };
  }

  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
  const ids = rows.map((r) => r.stableId);
  const idSet = new Set(ids);
  if (ids.length !== idSet.size) {
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`Duplicate audit identifiers: ${[...new Set(dup)].join(", ")}`);
  }

  for (const row of rows) {
    if (!row.stableId) errors.push("Blank stableId");
    if (!REQUIRED_STATUSES.has(row.finalStatus)) {
      errors.push(`Invalid/blank status for ${row.stableId}: ${row.finalStatus}`);
    }
    const tenantBearing =
      row.surfaceType === "server_action" ||
      row.surfaceType === "library" ||
      (row.surfaceType === "page" && row.requiredAuthentication !== "public");
    if (tenantBearing && !row.companyIdEnforcement?.trim()) {
      errors.push(`Missing companyId classification: ${row.stableId}`);
    }
    if (row.accessScopeApplicability === "yes" && !row.accessScopeEnforcement?.trim()) {
      errors.push(`Missing accessScope classification: ${row.stableId}`);
    }
    if (
      (row.finalStatus === "Verified safe" || row.finalStatus === "Fixed") &&
      !row.testEvidence?.trim()
    ) {
      errors.push(`Missing test evidence for ${row.stableId}`);
    }
  }

  const discovered = discoverAuthSurfaces();
  const discoveredIds = new Set(discovered.map((d) => d.stableId));

  for (const d of discovered) {
    if (!idSet.has(d.stableId)) {
      errors.push(`Missing real surface in audit: ${d.stableId}`);
    }
  }
  for (const id of idSet) {
    if (!discoveredIds.has(id)) {
      const row = rows.find((r) => r.stableId === id);
      if (row?.finalStatus !== "Removed") {
        errors.push(`Fabricated / nonexistent audit entry: ${id}`);
      }
    }
  }

  for (const id of discoverServerActionIds()) {
    if (!idSet.has(id)) errors.push(`Missing real server action: ${id}`);
  }
  for (const id of discoverApiMethodIds()) {
    if (!idSet.has(id)) errors.push(`Missing real API method: ${id}`);
  }

  const unresolved = rows.filter((r) => r.finalStatus === "Unresolved").length;
  const stats = rows.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.finalStatus] = (acc[r.finalStatus] ?? 0) + 1;
      return acc;
    },
    { total: 0, unresolved } as Record<string, number>
  );

  return { ok: errors.length === 0, errors, stats };
}

const isMain = process.argv[1]?.includes("check-audit");
if (isMain) {
  const result = checkAuthorizationAudit();
  console.log(
    JSON.stringify({ ok: result.ok, stats: result.stats, errorCount: result.errors.length }, null, 2)
  );
  if (!result.ok) {
    for (const e of result.errors.slice(0, 80)) console.error(" -", e);
    if (result.errors.length > 80) console.error(` ... +${result.errors.length - 80} more`);
    process.exit(1);
  }
}
