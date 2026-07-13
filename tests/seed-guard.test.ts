import { describe, it, expect } from "vitest";
import { assertDemoSeedAllowed, redactDatabaseUrl } from "@/lib/seed-guard";

describe("demo seed target safety", () => {
  it("allows local disposable database with all confirmations", () => {
    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: "development",
        ALLOW_DEMO_SEED: "true",
        SEED_CONFIRM: "DESTROY_AND_SEED",
        DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/hostpitality_test",
      })
    ).not.toThrow();
  });

  it("rejects missing allow flag and confirmation", () => {
    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: "development",
        ALLOW_DEMO_SEED: "false",
        SEED_CONFIRM: "DESTROY_AND_SEED",
        DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/hostpitality_test",
      })
    ).toThrow(/ALLOW_DEMO_SEED/);
    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: "development",
        ALLOW_DEMO_SEED: "true",
        SEED_CONFIRM: "NOPE",
        DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/hostpitality_test",
      })
    ).toThrow(/SEED_CONFIRM/);
  });

  it("rejects production NODE_ENV", () => {
    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: "production",
        ALLOW_DEMO_SEED: "true",
        SEED_CONFIRM: "DESTROY_AND_SEED",
        DATABASE_URL: "postgresql://u:p@127.0.0.1:5432/hostpitality_test",
      })
    ).toThrow(/production/);
  });

  it("rejects remote and ambiguous hosts without printing credentials", () => {
    try {
      assertDemoSeedAllowed({
        NODE_ENV: "development",
        ALLOW_DEMO_SEED: "true",
        SEED_CONFIRM: "DESTROY_AND_SEED",
        DATABASE_URL: "postgresql://secret-user:secret-pass@db.production.example:5432/app",
      });
      throw new Error("expected throw");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).not.toContain("secret-pass");
      expect(message).not.toContain("secret-user");
      expect(message).toMatch(/refuses|production|remote/i);
    }

    expect(() =>
      assertDemoSeedAllowed({
        NODE_ENV: "development",
        ALLOW_DEMO_SEED: "true",
        SEED_CONFIRM: "DESTROY_AND_SEED",
        DATABASE_URL: "postgresql://u:p@staging.internal:5432/app",
      })
    ).toThrow();
  });

  it("redacts credentials in URLs", () => {
    expect(redactDatabaseUrl("postgresql://alice:hunter2@localhost:5432/db")).toContain("***");
    expect(redactDatabaseUrl("postgresql://alice:hunter2@localhost:5432/db")).not.toContain(
      "hunter2"
    );
  });
});
