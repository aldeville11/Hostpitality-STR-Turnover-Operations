import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("demo seed protection", () => {
  it("rejects production seeding", () => {
    expect(() => {
      execSync("npx tsx prisma/seed.ts", {
        env: {
          ...process.env,
          NODE_ENV: "production",
          ALLOW_DEMO_SEED: "true",
          SEED_CONFIRM: "DESTROY_AND_SEED",
          DATABASE_URL: process.env.TEST_DATABASE_URL,
        },
        stdio: "pipe",
      });
    }).toThrow();
  });

  it("rejects seed without ALLOW_DEMO_SEED", () => {
    expect(() => {
      execSync("npx tsx prisma/seed.ts", {
        env: {
          ...process.env,
          NODE_ENV: "development",
          ALLOW_DEMO_SEED: "false",
          SEED_CONFIRM: "DESTROY_AND_SEED",
          DATABASE_URL: process.env.TEST_DATABASE_URL,
        },
        stdio: "pipe",
      });
    }).toThrow();
  });
});
