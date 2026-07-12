import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime, statusLabel } from "@/lib/utils";

export default async function TurnoversPage() {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");

  const turnovers = await prisma.turnover.findMany({
    where: { companyId: user.companyId },
    include: {
      property: true,
      assignments: { include: { teamMember: true } },
      issues: true,
      photos: true,
      checklist: true,
    },
    orderBy: { windowStart: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Turnovers"
        description="Checkout windows, scope, assignments, and closeout status."
      />

      {turnovers.length === 0 ? (
        <EmptyState
          title="No turnovers yet"
          description="Sync a property calendar or complete onboarding to create the first job."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80">
          <div className="hidden grid-cols-12 gap-2 border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] md:grid">
            <div className="col-span-3">Property</div>
            <div className="col-span-3">Window</div>
            <div className="col-span-2">Cleaner</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Status</div>
          </div>
          {turnovers.map((t) => {
            const done = t.checklist.filter((c) => c.completed).length;
            const cleaner = t.assignments[0]?.teamMember?.name ?? "Unassigned";
            return (
              <Link
                key={t.id}
                href={`/turnovers/${t.id}`}
                className="grid grid-cols-1 gap-2 border-b border-[var(--border)] px-4 py-3 last:border-0 hover:bg-[var(--surface-2)]/40 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-3">
                  <p className="font-medium">{t.property.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {t.property.unitCode}
                    {t.isDeepClean ? " · Deep clean" : ""}
                  </p>
                </div>
                <div className="text-sm text-[var(--muted)] md:col-span-3">
                  {formatDateTime(t.windowStart)} → {formatDateTime(t.windowEnd)}
                </div>
                <div className="text-sm md:col-span-2">{cleaner}</div>
                <div className="text-sm md:col-span-2">
                  {done}/{t.checklist.length} checklist · {t.photos.length} photos
                  {t.issues.length ? ` · ${t.issues.length} issues` : ""}
                </div>
                <div className="md:col-span-2">
                  <Badge
                    tone={
                      t.status === "COMPLETED"
                        ? "success"
                        : t.status === "OVERDUE" || t.status === "ISSUES_OPEN"
                          ? "danger"
                          : "accent"
                    }
                  >
                    {statusLabel(t.status)}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
