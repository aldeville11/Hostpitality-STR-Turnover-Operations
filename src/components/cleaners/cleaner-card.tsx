import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  AVAILABILITY_LABELS,
  TYPE_LABELS,
  type AvailabilityStatus,
} from "@/lib/cleaners";
import { formatDateTime } from "@/lib/utils";

type CleanerCardProps = {
  cleaner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    type: string;
    rating: number;
    capacity: number;
    openLoad: number;
    todayLoad: number;
    loadPct: number;
    available: boolean;
    availabilityStatus: string;
    coverageAreas: string[];
    skills: string[];
    upcoming: Array<{
      id: string;
      propertyName: string;
      windowStart: Date | string;
      status: string;
    }>;
  };
};

export function CleanerCard({ cleaner }: CleanerCardProps) {
  const availability =
    AVAILABILITY_LABELS[cleaner.availabilityStatus as AvailabilityStatus] ??
    cleaner.availabilityStatus;

  return (
    <Link
      href={`/cleaners/${cleaner.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {cleaner.name}
            </p>
            <Badge tone="neutral">{TYPE_LABELS[cleaner.type] ?? cleaner.type}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {cleaner.email}
            {cleaner.phone ? ` · ${cleaner.phone}` : ""}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Rating {cleaner.rating.toFixed(1)} · Load {cleaner.openLoad}/{cleaner.capacity} · Today{" "}
            {cleaner.todayLoad}
          </p>
          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className={`h-full rounded-full ${
                cleaner.loadPct >= 100
                  ? "bg-rose-500"
                  : cleaner.loadPct >= 70
                    ? "bg-amber-500"
                    : "bg-[var(--accent)]"
              }`}
              style={{ width: `${cleaner.loadPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {cleaner.coverageAreas.length === 0 ? (
              <Badge tone="neutral">No coverage set</Badge>
            ) : (
              cleaner.coverageAreas.slice(0, 4).map((area) => (
                <Badge key={area} tone="info">
                  {area}
                </Badge>
              ))
            )}
            {cleaner.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} tone="accent">
                {skill}
              </Badge>
            ))}
          </div>
          {cleaner.upcoming[0] ? (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Next: {cleaner.upcoming[0].propertyName} ·{" "}
              {formatDateTime(cleaner.upcoming[0].windowStart)}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)]">No upcoming assignments</p>
          )}
        </div>
        <Badge
          tone={
            cleaner.available
              ? "success"
              : cleaner.availabilityStatus === "OUT_OF_SERVICE"
                ? "danger"
                : "warning"
          }
        >
          {availability}
        </Badge>
      </div>
    </Link>
  );
}
