import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getDispatchBoard, listCleaners } from "@/lib/cleaners";
import { PageHeader } from "@/components/ui";
import { CleanerList } from "@/components/cleaners/cleaner-list";
import { ConflictAlert } from "@/components/cleaners/conflict-alert";

export default async function CleanersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; availability?: string; q?: string }>;
}) {
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");
  if (!can(user.role, "assignments:manage") && !can(user.role, "turnovers:manage")) {
    redirect("/dashboard");
  }

  const filters = await searchParams;
  const [cleaners, board] = await Promise.all([
    listCleaners(user.companyId, {
      type: filters.type || undefined,
      availability: filters.availability || undefined,
      q: filters.q || undefined,
    }),
    getDispatchBoard(user.companyId),
  ]);

  const boardConflicts = [
    ...board.overCapacity.map((c) => ({
      code: "over_capacity" as const,
      severity: "warn" as const,
      message: `${c.name} is at or over capacity (${c.openLoad}/${c.capacity})`,
    })),
    ...(board.unavailableCount
      ? [
          {
            code: "unavailable" as const,
            severity: "warn" as const,
            message: `${board.unavailableCount} cleaner(s) unavailable or out of service`,
          },
        ]
      : []),
    ...(board.gaps
      ? [
          {
            code: "coverage" as const,
            severity: "warn" as const,
            message: `${board.gaps} unassigned turnover(s) in the next 7 days`,
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Cleaner Assignments"
        description="Dispatch cleaners and vendors across turnover windows — workload, coverage, conflicts, and assignment history."
      />
      {boardConflicts.length ? (
        <div className="mb-6">
          <ConflictAlert conflicts={boardConflicts} title="Dispatch board alerts" />
        </div>
      ) : null}
      <CleanerList
        cleaners={cleaners}
        filters={filters}
        unassignedCount={board.unassigned.length}
      />
    </div>
  );
}
