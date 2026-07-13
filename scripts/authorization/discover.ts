/**
 * Source-derived authorization surface discovery.
 *
 * Parser: TypeScript-aware regex over repository files (not full AST).
 * Limitations:
 * - Detects `export async function Name` and `export function Name` forms only.
 * - Does not resolve re-exports or dynamically constructed handlers.
 * - Does not prove authorization correctness — only inventory coverage.
 * - `"use server"` modules are scanned for Action exports; non-action exports ignored.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../..");

export type DiscoveredSurface = {
  stableId: string;
  surfaceType:
    | "server_action"
    | "api_route"
    | "page"
    | "layout"
    | "library"
    | "security"
    | "ops";
  file: string;
  exportName: string;
  route?: string;
};

function walk(dir: string, pred: (f: string) => boolean): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      out.push(...walk(full, pred));
    } else if (pred(full)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function exportAsyncFunctions(source: string): string[] {
  const names: string[] = [];
  const re = /^export async function ([A-Za-z0-9_]+)\b/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) names.push(m[1]);
  return names;
}

function exportHttpMethods(source: string): string[] {
  const names: string[] = [];
  const re = /^export async function (GET|POST|PUT|PATCH|DELETE)\b/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) names.push(m[1]);
  return names;
}

const LIBRARY_MODULES = [
  "src/lib/properties.ts",
  "src/lib/turnovers.ts",
  "src/lib/cleaners.ts",
  "src/lib/issues.ts",
  "src/lib/qa.ts",
  "src/lib/reports.ts",
  "src/lib/dashboard.ts",
  "src/lib/settings.ts",
  "src/lib/sops.ts",
  "src/lib/sows.ts",
  "src/lib/integrations.ts",
  "src/lib/onboarding.ts",
  "src/lib/jobs.ts",
  "src/lib/access-scope.ts",
  "src/lib/auth.ts",
  "src/lib/rate-limit.ts",
  "src/lib/client-ip.ts",
  "src/lib/seed-guard.ts",
  "src/lib/launch.ts",
];

const SECURITY_OPS = [
  { file: "prisma/seed.ts", exportName: "main", surfaceType: "ops" as const },
  {
    file: "scripts/transfer-sqlite-to-postgres.ts",
    exportName: "main",
    surfaceType: "ops" as const,
  },
  {
    file: "scripts/verify-sqlite-transfer.ts",
    exportName: "main",
    surfaceType: "ops" as const,
  },
];

export function discoverAuthSurfaces(): DiscoveredSurface[] {
  const surfaces: DiscoveredSurface[] = [];
  const seen = new Set<string>();

  function add(s: DiscoveredSurface) {
    if (seen.has(s.stableId)) {
      throw new Error(`Duplicate discovered stableId: ${s.stableId}`);
    }
    seen.add(s.stableId);
    surfaces.push(s);
  }

  // Server actions
  const actionFiles = [
    path.join(ROOT, "src/lib/actions.ts"),
    ...walk(path.join(ROOT, "src/lib"), (f) => f.endsWith("-actions.ts")),
  ];
  for (const file of actionFiles) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const relFile = rel(file);
    for (const name of exportAsyncFunctions(source)) {
      if (!name.endsWith("Action") && relFile !== "src/lib/actions.ts") continue;
      if (relFile === "src/lib/actions.ts" && !name.endsWith("Action")) continue;
      add({
        stableId: `${relFile}::${name}`,
        surfaceType: "server_action",
        file: relFile,
        exportName: name,
      });
    }
  }

  // API routes
  for (const file of walk(path.join(ROOT, "src/app/api"), (f) => f.endsWith("route.ts"))) {
    const source = fs.readFileSync(file, "utf8");
    const relFile = rel(file);
    const route =
      "/" +
      relFile
        .replace(/^src\/app/, "")
        .replace(/\/route\.ts$/, "")
        .replace(/\(.*?\)\//g, "")
        .replace(/^\//, "");
    for (const method of exportHttpMethods(source)) {
      add({
        stableId: `${relFile}::${method}`,
        surfaceType: "api_route",
        file: relFile,
        exportName: method,
        route: route || "/",
      });
    }
  }

  // Pages and layouts
  for (const file of walk(path.join(ROOT, "src/app"), (f) => f.endsWith("page.tsx") || f.endsWith("layout.tsx"))) {
    const relFile = rel(file);
    const isLayout = relFile.endsWith("layout.tsx");
    add({
      stableId: `${relFile}::default`,
      surfaceType: isLayout ? "layout" : "page",
      file: relFile,
      exportName: "default",
      route: relFile
        .replace(/^src\/app/, "")
        .replace(/\/page\.tsx$/, "")
        .replace(/\/layout\.tsx$/, "")
        .replace(/\(.*?\)/g, "")
        .replace(/\/+/g, "/") || "/",
    });
  }

  // Library / security entry points
  for (const mod of LIBRARY_MODULES) {
    const file = path.join(ROOT, mod);
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, "utf8");
    const relFile = rel(file);
    for (const name of exportAsyncFunctions(source)) {
      // Skip internal-looking tiny helpers already covered elsewhere when needed
      add({
        stableId: `${relFile}::${name}`,
        surfaceType: relFile.includes("auth") || relFile.includes("rate-limit") || relFile.includes("client-ip") || relFile.includes("seed-guard") || relFile.includes("access-scope")
          ? "security"
          : "library",
        file: relFile,
        exportName: name,
      });
    }
    // sync helpers
    const syncRe = /^export function ([A-Za-z0-9_]+)\b/gm;
    let m: RegExpExecArray | null;
    while ((m = syncRe.exec(source))) {
      const name = m[1];
      if (
        name.startsWith("is") ||
        name.startsWith("can") ||
        name.startsWith("parse") ||
        name.startsWith("compose") ||
        name.startsWith("property") ||
        name.startsWith("issue") ||
        name.startsWith("assert") ||
        name.startsWith("scoped") ||
        name.startsWith("sanitize") ||
        name.startsWith("hash") ||
        name.startsWith("ip") ||
        name.startsWith("resolve") ||
        name.startsWith("redact") ||
        name.startsWith("session") ||
        name === "revokeSessionsOnPasswordChange" ||
        name === "resetServerEnvForTests"
      ) {
        const id = `${relFile}::${name}`;
        if (!seen.has(id)) {
          add({
            stableId: id,
            surfaceType: "security",
            file: relFile,
            exportName: name,
          });
        }
      }
    }
  }

  for (const op of SECURITY_OPS) {
    if (!fs.existsSync(path.join(ROOT, op.file))) continue;
    add({
      stableId: `${op.file}::${op.exportName}`,
      surfaceType: op.surfaceType,
      file: op.file,
      exportName: op.exportName,
    });
  }

  // Middleware
  const mw = path.join(ROOT, "src/middleware.ts");
  if (fs.existsSync(mw)) {
    add({
      stableId: "src/middleware.ts::middleware",
      surfaceType: "security",
      file: "src/middleware.ts",
      exportName: "middleware",
    });
  }

  return surfaces.sort((a, b) => a.stableId.localeCompare(b.stableId));
}

export function discoverServerActionIds(): string[] {
  return discoverAuthSurfaces()
    .filter((s) => s.surfaceType === "server_action")
    .map((s) => s.stableId);
}

export function discoverApiMethodIds(): string[] {
  return discoverAuthSurfaces()
    .filter((s) => s.surfaceType === "api_route")
    .map((s) => s.stableId);
}
