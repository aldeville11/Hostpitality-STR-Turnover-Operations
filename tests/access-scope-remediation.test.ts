import { describe, it, expect, afterAll, vi, beforeEach } from "vitest";
import { createTestPrisma } from "./helpers/db-guard";
import {
  createCompany,
  createCompanyFixtures,
  createProperty,
  createUser,
  createVendor,
} from "./helpers/factories";
import { listTurnovers, syncTurnoversFromCalendars } from "@/lib/turnovers";
import { listQaQueue, getQaDetail } from "@/lib/qa";
import { listIssues, getIssueDetail } from "@/lib/issues";
import { getPropertyReport } from "@/lib/reports";
import { getCleanerDetail } from "@/lib/cleaners";
import { parseAccessScope, composePropertyIdFilter } from "@/lib/access-scope";
import type { AuthUser } from "@/lib/auth";

const prisma = createTestPrisma();
const companyIds: string[] = [];

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireUser: (...args: unknown[]) => requireUserMock(...args),
  };
});

afterAll(async () => {
  for (const id of companyIds) {
    await prisma.company.delete({ where: { id } }).catch(() => undefined);
  }
  await prisma.$disconnect();
});

function asAuthUser(user: {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  role: string;
  accessScopeJson?: string | null;
}): AuthUser {
  return {
    ...(user as AuthUser),
    accessScope: parseAccessScope(user.accessScopeJson),
    company: user.companyId
      ? { id: user.companyId, name: "Co", slug: "co", onboardedAt: new Date() }
      : null,
  };
}

beforeEach(() => {
  requireUserMock.mockReset();
});

describe("accessScope remediation", () => {
  it("composePropertyIdFilter never widens via overwrite semantics", () => {
    const restricted = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: ["p1"] })
    );
    expect(composePropertyIdFilter(restricted, "p2").kind).toBe("empty");
    expect(composePropertyIdFilter(restricted, "p1")).toEqual({
      kind: "where",
      where: { propertyId: "p1" },
    });
    expect(composePropertyIdFilter(restricted)).toEqual({
      kind: "where",
      where: { propertyId: { in: ["p1"] } },
    });
    expect(composePropertyIdFilter(parseAccessScope("{}")).kind).toBe("empty");
  });

  it("exact out-of-scope propertyId filter cannot override list queries and reports", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const pA = fx.property;
    const pB = await createProperty(prisma, fx.company.id);

    const now = new Date();
    await prisma.turnover.create({
      data: {
        companyId: fx.company.id,
        propertyId: pA.id,
        status: "READY_FOR_QA",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    await prisma.turnover.create({
      data: {
        companyId: fx.company.id,
        propertyId: pB.id,
        status: "READY_FOR_QA",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    await prisma.issue.create({
      data: {
        companyId: fx.company.id,
        propertyId: pB.id,
        title: "Out of scope",
        description: "Should not appear",
        severity: "MEDIUM",
        category: "other",
        source: "MANUAL",
      },
    });

    const scope = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: [pA.id] })
    );

    expect(await listTurnovers(fx.company.id, { propertyId: pB.id }, scope)).toHaveLength(0);
    expect(await listQaQueue(fx.company.id, { propertyId: pB.id }, scope)).toHaveLength(0);
    expect(await listIssues(fx.company.id, { propertyId: pB.id }, scope)).toHaveLength(0);

    const report = await getPropertyReport(fx.company.id, { propertyId: pB.id }, scope);
    expect(report.properties).toHaveLength(0);
  });

  it("calendar sync only mutates in-scope properties", async () => {
    const company = await createCompany(prisma);
    companyIds.push(company.id);
    const user = await createUser(prisma, { companyId: company.id });
    const pA = await createProperty(prisma, company.id);
    const pB = await createProperty(prisma, company.id);
    await prisma.property.update({
      where: { id: pA.id },
      data: { calendarUrl: "https://example.com/a.ics", calendarStatus: "pending" },
    });
    await prisma.property.update({
      where: { id: pB.id },
      data: { calendarUrl: "https://example.com/b.ics", calendarStatus: "pending" },
    });

    const scope = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: [pA.id] })
    );
    const results = await syncTurnoversFromCalendars({
      companyId: company.id,
      userId: user.id,
      accessScope: scope,
    });
    expect(results.every((r) => r.propertyId === pA.id)).toBe(true);
    expect(await prisma.turnover.count({ where: { companyId: company.id, propertyId: pB.id } })).toBe(
      0
    );
    expect(
      await syncTurnoversFromCalendars({
        companyId: company.id,
        userId: user.id,
        accessScope: parseAccessScope(JSON.stringify({ allProperties: false, propertyIds: [] })),
      })
    ).toHaveLength(0);
  });

  it("cleaner detail filters assignments and aggregates to scoped properties", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const pA = fx.property;
    const pB = await createProperty(prisma, fx.company.id);
    const vendor = await createVendor(prisma, fx.company.id);
    const now = new Date();
    for (const propertyId of [pA.id, pB.id]) {
      await prisma.turnover.create({
        data: {
          companyId: fx.company.id,
          propertyId,
          vendorId: vendor.id,
          status: "ASSIGNED",
          windowStart: now,
          windowEnd: new Date(now.getTime() + 3600000),
          deadlineAt: new Date(now.getTime() + 7200000),
        },
      });
    }

    const scope = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: [pA.id] })
    );
    const detail = await getCleanerDetail(fx.company.id, vendor.id, scope);
    expect(detail!.vendor.openLoad).toBe(1);
    expect(detail!.vendor.assignments.every((a) => a.propertyId === pA.id)).toBe(true);
  });

  it("issue and QA detail picklists exclude out-of-scope values", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const pA = fx.property;
    const pB = await createProperty(prisma, fx.company.id);
    const now = new Date();
    const tA = await prisma.turnover.create({
      data: {
        companyId: fx.company.id,
        propertyId: pA.id,
        status: "READY_FOR_QA",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    await prisma.turnover.create({
      data: {
        companyId: fx.company.id,
        propertyId: pB.id,
        status: "READY_FOR_QA",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    const issue = await prisma.issue.create({
      data: {
        companyId: fx.company.id,
        propertyId: pA.id,
        turnoverId: tA.id,
        title: "Scoped",
        description: "ok",
        severity: "LOW",
        category: "other",
        source: "MANUAL",
      },
    });

    const scope = parseAccessScope(
      JSON.stringify({ allProperties: false, propertyIds: [pA.id] })
    );
    const issueDetail = await getIssueDetail(fx.company.id, issue.id, scope);
    expect(issueDetail!.properties.every((p) => p.id === pA.id)).toBe(true);
    expect(issueDetail!.turnovers.every((t) => t.propertyId === pA.id)).toBe(true);
    const qaDetail = await getQaDetail(fx.company.id, tA.id, scope);
    expect(qaDetail!.properties.every((p) => p.id === pA.id)).toBe(true);
  });

  it("mutation actions reject same-company out-of-scope and cross-company targets", async () => {
    const fx = await createCompanyFixtures(prisma, "A");
    companyIds.push(fx.company.id);
    const other = await createCompanyFixtures(prisma, "B");
    companyIds.push(other.company.id);
    const pA = fx.property;
    const pB = await createProperty(prisma, fx.company.id);

    const restrictedJson = JSON.stringify({ allProperties: false, propertyIds: [pA.id] });
    const user = await createUser(prisma, {
      companyId: fx.company.id,
      role: "OPS_MANAGER",
      accessScopeJson: restrictedJson,
    });
    requireUserMock.mockResolvedValue(asAuthUser(user));

    const now = new Date();
    const tB = await prisma.turnover.create({
      data: {
        companyId: fx.company.id,
        propertyId: pB.id,
        status: "ASSIGNED",
        windowStart: now,
        windowEnd: new Date(now.getTime() + 3600000),
        deadlineAt: new Date(now.getTime() + 7200000),
      },
    });
    const item = await prisma.turnoverChecklistItem.create({
      data: { turnoverId: tB.id, section: "General", title: "Test", sortOrder: 0 },
    });
    const inspection = await prisma.qaInspection.create({
      data: { companyId: fx.company.id, turnoverId: tB.id, status: "PENDING" },
    });

    const { updatePropertyCalendarAction } = await import("@/lib/property-actions");
    const { assignCleanerAction, toggleChecklistItemAction, regenerateChecklistAction } =
      await import("@/lib/turnover-actions");
    const { updatePropertyDefaultsAction } = await import("@/lib/settings-actions");
    const { createIssuesFromQaAction } = await import("@/lib/issue-actions");

    const fd = (entries: Record<string, string>) => {
      const form = new FormData();
      for (const [k, v] of Object.entries(entries)) form.set(k, v);
      return form;
    };

    expect(await updatePropertyCalendarAction(fd({ id: pB.id, calendarUrl: "https://x" }))).toEqual({
      error: "Not found",
    });
    expect(
      await updatePropertyCalendarAction(fd({ id: other.property.id, calendarUrl: "https://x" }))
    ).toEqual({ error: "Property not found" });

    expect(await assignCleanerAction(fd({ id: tB.id, vendorId: "" }))).toEqual({
      error: "Not found",
    });
    expect(await toggleChecklistItemAction(fd({ itemId: item.id }))).toEqual({ error: "Not found" });
    expect(await regenerateChecklistAction(fd({ id: tB.id }))).toEqual({ error: "Not found" });
    expect(await updatePropertyDefaultsAction(fd({ propertyId: pB.id, active: "1" }))).toMatchObject({
      error: expect.any(String),
    });

    // Omitted turnoverId still resolves inspection → out-of-scope rejection
    expect(await createIssuesFromQaAction(fd({ inspectionId: inspection.id }))).toEqual({
      error: "Not found",
    });
    expect(
      await createIssuesFromQaAction(
        fd({ inspectionId: inspection.id, turnoverId: "mismatched-id" })
      )
    ).toEqual({ error: "Not found" });

    // Allowed property succeeds for calendar update
    const ok = await updatePropertyCalendarAction(
      fd({ id: pA.id, calendarUrl: "https://allowed.example/cal.ics" })
    );
    expect(ok).toBeUndefined();
    const updated = await prisma.property.findUniqueOrThrow({ where: { id: pA.id } });
    expect(updated.calendarUrl).toContain("allowed.example");
  });
});
