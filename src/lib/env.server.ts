type ServerEnv = {
  nodeEnv: "development" | "production" | "test";
  isProduction: boolean;
  databaseUrl: string;
  sessionPepper: string;
  cronSecret: string;
  cronSecretPrevious?: string;
  redisUrl: string;
  rateLimitPepper: string;
  logLevel: "debug" | "info" | "warn" | "error";
  jobBatchSize: number;
  /** Seconds before a RUNNING job claim may be reclaimed after worker failure. */
  jobLeaseSeconds: number;
  /**
   * Trusted proxy mode for client IP resolution used by rate limiting.
   * - vercel: trust platform-controlled forwarded headers (Vercel)
   * - single-hop: trust x-real-ip / leftmost x-forwarded-for only when TRUST_PROXY=single-hop
   * - none: never trust client-supplied proxy headers (IP identity = "unknown")
   */
  trustProxyMode: "vercel" | "single-hop" | "none";
  appBaseUrl?: string;
  allowAuthBypass: boolean;
  allowDemoSeed: boolean;
  seedConfirm?: string;
  testDatabaseUrl?: string;
};

let cached: ServerEnv | null = null;

function readNodeEnv(): ServerEnv["nodeEnv"] {
  const raw = process.env.NODE_ENV;
  if (raw === "production" || raw === "test") return raw;
  return "development";
}

function requireNonEmpty(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePositiveInt(name: string, value: string | undefined, fallback: number): number {
  if (!value || !value.trim()) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Invalid ${name}: must be a positive integer`);
  }
  return n;
}

function parseLogLevel(value: string | undefined): ServerEnv["logLevel"] {
  const level = (value ?? "info").toLowerCase();
  if (level === "debug" || level === "info" || level === "warn" || level === "error") {
    return level;
  }
  throw new Error("Invalid LOG_LEVEL: must be debug, info, warn, or error");
}

function assertPostgresUrl(url: string) {
  const lower = url.toLowerCase();
  if (lower.startsWith("file:") || lower.includes("sqlite")) {
    throw new Error("DATABASE_URL must use PostgreSQL in production (SQLite is not permitted)");
  }
  if (!lower.startsWith("postgresql://") && !lower.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string");
  }
}

function validateProduction(env: ServerEnv) {
  assertPostgresUrl(env.databaseUrl);

  requireNonEmpty("SESSION_PEPPER", env.sessionPepper);
  requireNonEmpty("CRON_SECRET", env.cronSecret);
  requireNonEmpty("REDIS_URL", env.redisUrl);
  requireNonEmpty("RATE_LIMIT_PEPPER", env.rateLimitPepper);

  if (env.allowAuthBypass) {
    throw new Error("Authentication bypass is not permitted in production");
  }
  if (process.env.ALLOW_AUTH_BYPASS === "true") {
    throw new Error("ALLOW_AUTH_BYPASS is not permitted in production");
  }
  if (env.allowDemoSeed) {
    throw new Error("Demo seeding is not permitted in production");
  }
  if (process.env.AUTH_BYPASS) {
    throw new Error("Legacy AUTH_BYPASS is not permitted in production");
  }
  if (process.env.ALLOW_DEMO_SEED === "true") {
    throw new Error("ALLOW_DEMO_SEED is not permitted in production");
  }
}

function parseTrustProxyMode(value: string | undefined): ServerEnv["trustProxyMode"] {
  const raw = (value ?? "").trim().toLowerCase();
  if (raw === "vercel" || raw === "single-hop" || raw === "none") return raw;
  // Auto-detect Vercel when unset
  if (process.env.VERCEL === "1") return "vercel";
  return "none";
}

/** Lazy, cached server environment validation. Fail closed in production. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const nodeEnv = readNodeEnv();
  const isProduction = nodeEnv === "production";

  const databaseUrl =
    nodeEnv === "test"
      ? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? ""
      : process.env.DATABASE_URL ?? "";

  const allowAuthBypass =
    !isProduction &&
    process.env.ALLOW_AUTH_BYPASS === "true" &&
    process.env.AUTH_BYPASS !== "0";

  const allowDemoSeed =
    !isProduction &&
    process.env.ALLOW_DEMO_SEED === "true" &&
    Boolean(process.env.SEED_CONFIRM?.trim());

  const env: ServerEnv = {
    nodeEnv,
    isProduction,
    databaseUrl,
    sessionPepper: process.env.SESSION_PEPPER ?? "",
    cronSecret: process.env.CRON_SECRET ?? "",
    cronSecretPrevious: process.env.CRON_SECRET_PREVIOUS?.trim() || undefined,
    redisUrl: process.env.REDIS_URL ?? "",
    rateLimitPepper: process.env.RATE_LIMIT_PEPPER ?? "",
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
    jobBatchSize: parsePositiveInt("JOB_BATCH_SIZE", process.env.JOB_BATCH_SIZE, 25),
    jobLeaseSeconds: parsePositiveInt("JOB_LEASE_SECONDS", process.env.JOB_LEASE_SECONDS, 900),
    trustProxyMode: parseTrustProxyMode(process.env.TRUST_PROXY),
    appBaseUrl: process.env.APP_BASE_URL?.trim() || undefined,
    allowAuthBypass,
    allowDemoSeed,
    seedConfirm: process.env.SEED_CONFIRM?.trim(),
    testDatabaseUrl: process.env.TEST_DATABASE_URL?.trim(),
  };

  if (isProduction) {
    validateProduction(env);
  }

  cached = env;
  return env;
}

/** Reset cached env — for tests only. */
export function resetServerEnvForTests() {
  cached = null;
}
