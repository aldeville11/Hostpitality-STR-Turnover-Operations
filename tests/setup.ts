import { config } from "dotenv";

config({ path: ".env.test", override: true });

// Vitest runs with NODE_ENV=test by default

const testDb = process.env.TEST_DATABASE_URL;
if (!testDb) {
  throw new Error("TEST_DATABASE_URL is required for tests");
}

const lower = testDb.toLowerCase();
const forbidden = ["production", "staging", "prod", "live"];
for (const marker of forbidden) {
  if (lower.includes(marker)) {
    throw new Error(`Refusing to run tests against database URL containing '${marker}'`);
  }
}

if (lower.includes("sqlite") || lower.startsWith("file:")) {
  throw new Error("Tests must use PostgreSQL TEST_DATABASE_URL");
}

process.env.DATABASE_URL = testDb;
process.env.SESSION_PEPPER = process.env.SESSION_PEPPER ?? "test-session-pepper-32chars-min";
process.env.CRON_SECRET = process.env.CRON_SECRET ?? "test-cron-secret";
process.env.RATE_LIMIT_PEPPER = process.env.RATE_LIMIT_PEPPER ?? "test-rate-limit-pepper";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";
