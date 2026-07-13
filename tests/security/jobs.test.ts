import { describe, it, expect } from "vitest";
import { secretsEqual, secretsMatchRotation } from "@/lib/secrets";

describe("job processor secrets", () => {
  it("rejects invalid cron secret", () => {
    expect(secretsEqual("wrong", "expected-secret")).toBe(false);
  });

  it("accepts valid cron secret with constant-time compare", () => {
    expect(secretsEqual("expected-secret", "expected-secret")).toBe(true);
  });

  it("accepts previous secret during rotation", () => {
    expect(
      secretsMatchRotation("old-secret", "new-secret", "old-secret")
    ).toBe(true);
    expect(secretsMatchRotation("invalid", "new-secret", "old-secret")).toBe(false);
  });
});
