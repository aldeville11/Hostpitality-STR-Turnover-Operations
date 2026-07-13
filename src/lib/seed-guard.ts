/**
 * Demo seed target safety guards.
 * Destructive seeding is local/disposable only — never staging/production remotes.
 */

const FORBIDDEN_HOST_MARKERS = [
  "production",
  "staging",
  "prod.",
  ".prod",
  "amazonaws.com",
  "neon.tech",
  "supabase.co",
  "railway.app",
  "render.com",
  "azure.com",
  "cloudsql",
];

const ALLOWED_LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "host.docker.internal",
]);

export function redactDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    if (parsed.username) parsed.username = "***";
    return parsed.toString();
  } catch {
    return "[unparseable-database-url]";
  }
}

export function assertDemoSeedTargetAllowed(
  databaseUrl: string | undefined,
  env: NodeJS.ProcessEnv = process.env
) {
  if (!databaseUrl || !databaseUrl.trim()) {
    throw new Error("Demo seed requires DATABASE_URL");
  }
  const url = databaseUrl.trim();
  const lower = url.toLowerCase();

  if (lower.startsWith("file:") || lower.includes("sqlite")) {
    throw new Error("Demo seed requires a PostgreSQL DATABASE_URL after migration");
  }
  if (!lower.startsWith("postgresql://") && !lower.startsWith("postgres://")) {
    throw new Error("Demo seed requires a PostgreSQL DATABASE_URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Demo seed DATABASE_URL is malformed");
  }

  const host = parsed.hostname.toLowerCase();
  if (!host) {
    throw new Error("Demo seed DATABASE_URL is missing a hostname");
  }

  for (const marker of FORBIDDEN_HOST_MARKERS) {
    if (host.includes(marker) || lower.includes(marker)) {
      throw new Error(
        `Demo seed refuses non-local database target (${redactDatabaseUrl(url)})`
      );
    }
  }

  const isLocal =
    ALLOWED_LOCAL_HOSTS.has(host) ||
    host.endsWith(".local") ||
    host === "postgres"; // docker-compose / CI service hostname on local networks

  // RFC1918 and other private hosts are refused by default — they may host
  // staging/production data. Override only via exact allowlist:
  // DEMO_SEED_ALLOWED_HOSTS=host1,host2 plus SEED_CONFIRM_REMOTE=DESTROY_REMOTE_SEED
  const allowlist = (env.DEMO_SEED_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const remoteConfirm = env.SEED_CONFIRM_REMOTE?.trim();
  const allowlistedRemote =
    allowlist.includes(host) && remoteConfirm === "DESTROY_REMOTE_SEED";

  if (!isLocal && !allowlistedRemote) {
    throw new Error(
      `Demo seed refuses remote/ambiguous database host (${redactDatabaseUrl(url)})`
    );
  }
}

export function assertDemoSeedAllowed(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV === "production") {
    throw new Error("Demo seeding is not permitted in production");
  }
  if (env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seed requires ALLOW_DEMO_SEED=true");
  }
  const confirm = env.SEED_CONFIRM?.trim();
  if (!confirm || confirm !== "DESTROY_AND_SEED") {
    throw new Error("Demo seed requires SEED_CONFIRM=DESTROY_AND_SEED");
  }
  assertDemoSeedTargetAllowed(env.DATABASE_URL, env);
}
