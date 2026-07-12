import Link from "next/link";
import { EmptyState, ModuleCard, Stat, StatusBadge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";

export function PhotoStatus({
  photoStats,
  todaysPhotoGaps,
}: {
  photoStats: DashboardData["photoStats"];
  todaysPhotoGaps: DashboardData["todaysPhotoGaps"];
}) {
  const verifiedPct =
    photoStats.required === 0
      ? 0
      : Math.round((photoStats.verified / Math.max(photoStats.required, 1)) * 100);

  return (
    <ModuleCard
      title="Photo & QA evidence"
      description="Required photo coverage for recent turnovers and today’s gaps."
      actions={
        <>
          <StatusBadge status={photoStats.missingEvidence ? "at_risk" : "healthy"}>
            {verifiedPct}% verified
          </StatusBadge>
          <Link
            href="/qa"
            className="text-sm font-semibold text-[var(--accent-strong)] hover:underline"
          >
            QA queue
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Required" value={photoStats.required} hint="Photo slots required" />
        <Stat label="Uploaded" value={photoStats.uploaded} hint="Evidence on file" />
        <Stat
          label="Verified"
          value={photoStats.verified}
          hint="Passed verification"
          emphasis={photoStats.missingEvidence > 0}
        />
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        {photoStats.awaitingVerification} turnover
        {photoStats.awaitingVerification === 1 ? "" : "s"} awaiting verification ·{" "}
        {photoStats.missingEvidence} with missing evidence
      </p>

      {todaysPhotoGaps.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No photo gaps today"
            description="Today’s jobs have all required photo slots covered or are already complete."
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {todaysPhotoGaps.map((t) => (
            <li key={t.id}>
              <Link
                href={`/turnovers/${t.id}`}
                className="flex min-h-11 flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-[var(--surface-raised)]"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  {t.property.name} · {t.property.unitCode}
                </span>
                <StatusBadge status="at_risk">
                  {t.photosUploaded}/{t.photosRequired} photos
                </StatusBadge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}
