type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "password_hash",
  "cookie",
  "cookies",
  "authorization",
  "auth",
  "token",
  "session",
  "apikey",
  "api_key",
  "secret",
  "cron_secret",
  "session_pepper",
  "rate_limit_pepper",
  "database_url",
  "redis_url",
  "dsn",
  "pepper",
  "rawtoken",
  "raw_token",
  "tokenhash",
]);

const REDACTED = "[REDACTED]";

function shouldLog(level: LogLevel): boolean {
  try {
    const configured = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
    const min = LEVEL_ORDER[configured] ?? LEVEL_ORDER.info;
    return LEVEL_ORDER[level] >= min;
  } catch {
    return level !== "debug";
  }
}

function redactValue(key: string, value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED;
  if (value == null) return value;

  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (SENSITIVE_KEYS.has(normalized)) return REDACTED;

  if (typeof value === "string") {
    if (/postgresql?:\/\//i.test(value) || /^redis:\/\//i.test(value)) return REDACTED;
    if (normalized.includes("url") && value.includes("@")) return REDACTED;
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, i) => redactValue(`${key}.${i}`, item, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(k, v, depth + 1);
    }
    return out;
  }

  return value;
}

export function redactContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;
  return redactValue("context", context) as Record<string, unknown>;
}

function safeEmit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  try {
    const entry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...(redactContext(context) ?? {}),
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  } catch {
    // Logging must never crash application workflows.
  }
}

/** Structured logging with automatic redaction. */
export const log = {
  debug: (message: string, context?: Record<string, unknown>) =>
    safeEmit("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    safeEmit("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    safeEmit("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    safeEmit("error", message, context),
};

export function captureError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  log.error(message, { ...context, stack });
  return message;
}
