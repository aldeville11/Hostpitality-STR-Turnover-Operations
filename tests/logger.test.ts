import { describe, it, expect } from "vitest";
import { redactContext } from "@/lib/logger";

describe("logger redaction", () => {
  it("redacts sensitive keys", () => {
    const redacted = redactContext({
      password: "secret",
      authorization: "Bearer abc",
      session: "tok",
      cron_secret: "cron",
      database_url: "postgresql://user:pass@host/db",
      safeField: "visible",
    }) as Record<string, unknown>;

    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.session).toBe("[REDACTED]");
    expect(redacted.cron_secret).toBe("[REDACTED]");
    expect(redacted.database_url).toBe("[REDACTED]");
    expect(redacted.safeField).toBe("visible");
  });

  it("redacts nested sensitive values", () => {
    const redacted = redactContext({
      user: { passwordHash: "hash", name: "Alex" },
    }) as Record<string, unknown>;
    const user = redacted.user as Record<string, unknown>;
    expect(user.passwordHash).toBe("[REDACTED]");
    expect(user.name).toBe("Alex");
  });
});
