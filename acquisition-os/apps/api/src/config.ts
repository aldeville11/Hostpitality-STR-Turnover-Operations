/**
 * Runtime config for Identity / session auth (ADR 0002).
 * Owner: Backend Lead · Reviewer: Security Engineer
 */

export type ApiConfig = {
  nodeEnv: string;
  port: number;
  sessionPepper: string;
  bcryptCost: number;
  sessionTtlMs: number;
  cookieSecure: boolean;
  corsOrigin: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  const nodeEnv = env.NODE_ENV ?? "development";
  const sessionPepper = env.SESSION_PEPPER?.trim();
  if (!sessionPepper) {
    throw new Error("SESSION_PEPPER is required (set in env; never commit real values).");
  }

  const bcryptCost = Number(env.BCRYPT_COST ?? (nodeEnv === "test" ? 4 : 12));
  if (!Number.isInteger(bcryptCost) || bcryptCost < 4) {
    throw new Error("BCRYPT_COST must be an integer ≥ 4 (ADR 0002: ≥ 12 in production).");
  }
  if (nodeEnv === "production" && bcryptCost < 12) {
    throw new Error("BCRYPT_COST must be ≥ 12 in production (ADR 0002).");
  }

  const sessionTtlHours = Number(env.SESSION_TTL_HOURS ?? 12);
  if (!Number.isFinite(sessionTtlHours) || sessionTtlHours <= 0) {
    throw new Error("SESSION_TTL_HOURS must be a positive number.");
  }

  return {
    nodeEnv,
    port: Number(env.API_PORT ?? 3001),
    sessionPepper,
    bcryptCost,
    sessionTtlMs: Math.floor(sessionTtlHours * 60 * 60 * 1000),
    cookieSecure: nodeEnv === "production",
    corsOrigin: env.CORS_ORIGIN ?? env.APP_URL ?? "http://localhost:5173",
  };
}
