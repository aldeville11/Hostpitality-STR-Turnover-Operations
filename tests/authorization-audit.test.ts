import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { discoverServerActionIds, discoverApiMethodIds, discoverAuthSurfaces } from "../scripts/authorization/discover";
import { checkAuthorizationAudit } from "../scripts/authorization/check-audit";

const CSV = path.resolve(__dirname, "../docs/audits/tenant-isolation.csv");

describe("authorization audit inventory check", () => {
  it("passes against the current source-derived CSV", () => {
    const result = checkAuthorizationAudit();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats.unresolved).toBe(0);
  });

  it("includes every current exported server action and API method", () => {
    const text = fs.readFileSync(CSV, "utf8");
    for (const id of discoverServerActionIds()) {
      expect(text).toContain(id);
    }
    for (const id of discoverApiMethodIds()) {
      expect(text).toContain(id);
    }
    expect(discoverServerActionIds().length).toBeGreaterThanOrEqual(70);
  });

  it("detects missing real action", () => {
    const original = fs.readFileSync(CSV, "utf8");
    const lines = original.trim().split("\n");
    const actionLine = lines.findIndex((l) => l.includes("::loginAction"));
    expect(actionLine).toBeGreaterThan(0);
    const mutated = [...lines.slice(0, actionLine), ...lines.slice(actionLine + 1)].join("\n") + "\n";
    fs.writeFileSync(CSV, mutated);
    try {
      const result = checkAuthorizationAudit();
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("loginAction"))).toBe(true);
    } finally {
      fs.writeFileSync(CSV, original);
    }
  });

  it("detects fabricated action", () => {
    const original = fs.readFileSync(CSV, "utf8");
    const fake =
      'src/lib/fake-actions.ts::fabricatedAction,server_action,src/lib/fake-actions.ts,fabricatedAction,,session,x,x,x,x,no,n/a,x,x,reviewed-code,Verified safe,fake\n';
    fs.writeFileSync(CSV, original.trimEnd() + "\n" + fake);
    try {
      const result = checkAuthorizationAudit();
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("fabricatedAction"))).toBe(true);
    } finally {
      fs.writeFileSync(CSV, original);
    }
  });

  it("detects duplicate identifier", () => {
    const original = fs.readFileSync(CSV, "utf8");
    const line = original.trim().split("\n").find((l) => l.includes("::loginAction"))!;
    fs.writeFileSync(CSV, original.trimEnd() + "\n" + line + "\n");
    try {
      const result = checkAuthorizationAudit();
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
    } finally {
      fs.writeFileSync(CSV, original);
    }
  });

  it("detects missing classification fields", () => {
    const original = fs.readFileSync(CSV, "utf8");
    const lines = original.trim().split("\n");
    const idx = lines.findIndex((l) => l.includes("::loginAction"));
    const cols = lines[idx].split(",");
    // blank finalStatus (column index 15)
    cols[15] = "";
    lines[idx] = cols.join(",");
    fs.writeFileSync(CSV, lines.join("\n") + "\n");
    try {
      const result = checkAuthorizationAudit();
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => /status|loginAction/i.test(e))).toBe(true);
    } finally {
      fs.writeFileSync(CSV, original);
    }
  });

  it("discovery finds pages and layouts", () => {
    const surfaces = discoverAuthSurfaces();
    expect(surfaces.some((s) => s.surfaceType === "page")).toBe(true);
    expect(surfaces.some((s) => s.surfaceType === "layout")).toBe(true);
    expect(surfaces.some((s) => s.surfaceType === "api_route")).toBe(true);
  });
});
