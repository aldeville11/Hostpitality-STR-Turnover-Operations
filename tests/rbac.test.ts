import { describe, it, expect } from "vitest";
import { can, ROLES } from "@/lib/rbac";

describe("RBAC", () => {
  it("denies inventory to cleaner role", () => {
    expect(can("CLEANER", "inventory:manage")).toBe(false);
  });

  it("grants inventory to ops manager", () => {
    expect(can("OPS_MANAGER", "inventory:manage")).toBe(true);
  });

  it("denies owners report to cleaner", () => {
    expect(can("CLEANER", "owners:report")).toBe(false);
  });

  it("grants onboarding only to permitted roles", () => {
    expect(can("PROPERTY_MANAGER", "onboarding:run")).toBe(false);
    expect(can("OPS_MANAGER", "onboarding:run")).toBe(true);
    expect(can("OWNER_OPERATOR", "onboarding:run")).toBe(true);
  });

  it("defines permissions for all six roles", () => {
    expect(ROLES).toHaveLength(6);
    for (const role of ROLES) {
      expect(can(role, "dashboard:view")).toBe(true);
    }
  });
});
