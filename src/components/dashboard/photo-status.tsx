import { Badge } from "@/components/ui";
import type { DashboardData } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/utils";

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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Photo verification
        </h2>
        <Badge tone={photoStats.missingEvidence ? "warning" : "success"}>
          {verifiedPct}% verified
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[var(--surface-2)]/60 px-2 py-3">
          <p className="text-lg font-semibold">{photoStats.required}</p>
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Required</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)]/60 px-2 py-3">
          <p className="text-lg font-semibold">{photoStats.uploaded}</p>
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Uploaded</p>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)]/60 px-2 py-3">
          <p className="text-lg font-semibold">{photoStats.verified}</p>
          <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Verified</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        {photoStats.awaitingVerification} turnover(s) awaiting verification ·{" "}
        {photoStats.missingEvidence} with missing evidence
      </p>

      {todaysPhotoGaps.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Today’s jobs have all required photo slots covered or are already complete.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {todaysPhotoGaps.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span>
                {t.property.name} · {t.property.unitCode}
              </span>
              <Badge tone="warning">
                {t.photosUploaded}/{t.photosRequired} photos
              </Badge>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[10px] text-[var(--muted)]">
        Snapshot as of {formatDateTime(new Date())}
      </p>
    </section>
  );
}
