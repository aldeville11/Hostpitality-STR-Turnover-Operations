import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Label, PageHeader, Select } from "@/components/ui";
import { assignCleanerAction } from "@/lib/actions";
import { formatDateTime, statusLabel } from "@/lib/utils";

export default async function AssignmentsPage() {
  const user = await requireUser({ permission: "assignments:manage" });
  if (!user.companyId) redirect("/onboarding");

  const [assignments, cleaners, unassigned] = await Promise.all([
    prisma.cleanerAssignment.findMany({
      where: { turnover: { companyId: user.companyId } },
      include: {
        teamMember: true,
        turnover: { include: { property: true } },
      },
      orderBy: { assignedAt: "desc" },
      take: 40,
    }),
    prisma.teamMember.findMany({
      where: { companyId: user.companyId, role: { in: ["CLEANER", "VENDOR"] }, active: true },
    }),
    prisma.turnover.findMany({
      where: {
        companyId: user.companyId,
        status: { in: ["SCHEDULED", "OVERDUE"] },
        assignments: { none: {} },
      },
      include: { property: true },
      orderBy: { windowStart: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Cleaner Assignments"
        description="Dispatch cleaners and vendors to turnover windows."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {assignments.length === 0 ? (
            <EmptyState title="No assignments" description="Assign a cleaner to a turnover to get started." />
          ) : (
            assignments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div>
                  <p className="font-semibold">{a.teamMember?.name ?? "Unknown"}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {a.turnover.property.name} · {formatDateTime(a.turnover.windowStart)}
                  </p>
                  {a.notes ? <p className="text-xs text-[var(--muted)]">{a.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{statusLabel(a.status)}</Badge>
                  {a.dispatchedAt ? <Badge tone="success">Dispatched</Badge> : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <form
            action={assignCleanerAction}
            className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Assign cleaner
            </h2>
            <div>
              <Label htmlFor="turnoverId">Turnover</Label>
              <Select id="turnoverId" name="turnoverId" required defaultValue="">
                <option value="" disabled>
                  Select turnover
                </option>
                {unassigned.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.property.name} · {formatDateTime(t.windowStart)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="teamMemberId">Cleaner / vendor</Label>
              <Select id="teamMemberId" name="teamMemberId" required defaultValue="">
                <option value="" disabled>
                  Select person
                </option>
                {cleaners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({statusLabel(c.role)})
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Assign & queue dispatch
            </Button>
          </form>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
            <h3 className="font-semibold">Team availability</h3>
            <div className="mt-3 space-y-2">
              {cleaners.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.name}</span>
                  <Badge>{statusLabel(c.role)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
