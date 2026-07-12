import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, PageHeader, Stat } from "@/components/ui";
import { formatDateTime, statusLabel } from "@/lib/utils";
import { approveAgentAction } from "@/lib/actions";
import Link from "next/link";
import { agentLabel } from "@/lib/agents";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");
  if (user.company && !user.company.onboardedAt) redirect("/onboarding");

  const companyId = user.companyId;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [
    todaysTurnovers,
    overdue,
    assignments,
    openIssues,
    pendingPhotos,
    inventoryLow,
    completed,
    totalRecent,
    ownerNotified,
    pendingActions,
  ] = await Promise.all([
    prisma.turnover.findMany({
      where: {
        companyId,
        windowStart: { gte: start, lte: end },
      },
      include: { property: true, assignments: { include: { teamMember: true } } },
      orderBy: { windowStart: "asc" },
    }),
    prisma.turnover.count({ where: { companyId, status: "OVERDUE" } }),
    prisma.cleanerAssignment.findMany({
      where: { turnover: { companyId }, status: { in: ["assigned", "dispatched", "in_progress"] } },
      include: { teamMember: true, turnover: { include: { property: true } } },
      take: 8,
      orderBy: { assignedAt: "desc" },
    }),
    prisma.issue.count({
      where: { turnover: { companyId }, status: { in: ["OPEN", "ESCALATED", "IN_PROGRESS"] } },
    }),
    prisma.photoSubmission.count({
      where: { turnover: { companyId }, verified: false, rejected: false },
    }),
    prisma.inventoryItem.findMany({ where: { companyId } }).then((items) =>
      items.filter((i) => i.quantity <= i.reorderLevel)
    ),
    prisma.turnover.count({
      where: {
        companyId,
        status: "COMPLETED",
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.turnover.count({
      where: {
        companyId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.turnover.count({
      where: {
        companyId,
        ownerNotifiedAt: { not: null },
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.agentAction.findMany({
      where: { companyId, status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { turnover: { include: { property: true } } },
    }),
  ]);

  const completionRate = totalRecent === 0 ? 0 : Math.round((completed / totalRecent) * 100);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today’s turnovers, cleaner load, QA status, and AI actions awaiting approval."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Today’s turnovers" value={todaysTurnovers.length} />
        <Stat label="Overdue jobs" value={overdue} hint={overdue ? "Needs attention" : "All clear"} />
        <Stat label="Open issues" value={openIssues} />
        <Stat label="Photo verification pending" value={pendingPhotos} />
        <Stat label="Inventory alerts" value={inventoryLow.length} />
        <Stat label="Completion rate (30d)" value={`${completionRate}%`} />
        <Stat label="Owner notifications sent" value={ownerNotified} />
        <Stat label="Active assignments" value={assignments.length} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Today’s turnovers</h2>
            <Link href="/turnovers" className="text-sm font-medium text-[var(--accent)]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {todaysTurnovers.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No turnovers scheduled for today.</p>
            ) : (
              todaysTurnovers.map((t) => (
                <Link
                  key={t.id}
                  href={`/turnovers/${t.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-3 hover:bg-[var(--surface-2)]/50"
                >
                  <div>
                    <p className="font-medium">{t.property.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {t.property.unitCode} · {formatDateTime(t.windowStart)} –{" "}
                      {formatDateTime(t.windowEnd)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      t.status === "OVERDUE"
                        ? "danger"
                        : t.status === "COMPLETED"
                          ? "success"
                          : "accent"
                    }
                  >
                    {statusLabel(t.status)}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              AI actions awaiting approval
            </h2>
          </div>
          <div className="space-y-3">
            {pendingActions.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No pending agent actions.</p>
            ) : (
              pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                        {agentLabel(action.agentType)}
                      </p>
                      <p className="font-medium">{action.title}</p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">{action.description}</p>
                      {action.turnover?.property ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {action.turnover.property.name}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <form action={approveAgentAction}>
                        <input type="hidden" name="id" value={action.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <button className="rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-xs font-medium text-white">
                          Approve
                        </button>
                      </form>
                      <form action={approveAgentAction}>
                        <input type="hidden" name="id" value={action.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <button className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium">
                          Reject
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Cleaner assignments
          </h2>
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{a.teamMember?.name ?? "Unassigned"}</p>
                  <p className="text-xs text-[var(--muted)]">{a.turnover.property.name}</p>
                </div>
                <Badge tone="info">{statusLabel(a.status)}</Badge>
              </div>
            ))}
            {assignments.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No active assignments.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
            Inventory alerts
          </h2>
          <div className="space-y-2">
            {inventoryLow.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <p className="font-medium">{item.name}</p>
                <Badge tone="warning">
                  {item.quantity} / {item.reorderLevel} {item.unit}
                </Badge>
              </div>
            ))}
            {inventoryLow.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Stock levels look healthy.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
