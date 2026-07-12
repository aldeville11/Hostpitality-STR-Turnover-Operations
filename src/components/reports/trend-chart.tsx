import type { TrendPoint } from "@/lib/reports";

export function TrendChart({
  title,
  description,
  points,
  primaryLabel = "Volume",
  secondaryLabel,
  emptyMessage = "No data in this range.",
}: {
  title: string;
  description?: string;
  points: TrendPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  emptyMessage?: string;
}) {
  const max = Math.max(1, ...points.map((p) => Math.max(p.value, p.secondary ?? 0)));
  const hasData = points.some((p) => p.value > 0 || (p.secondary ?? 0) > 0);

  // Downsample for readability when many days
  const display =
    points.length > 21
      ? points.filter((_, i) => i % Math.ceil(points.length / 14) === 0 || i === points.length - 1)
      : points;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-[var(--accent)]" />
            {primaryLabel}
          </span>
          {secondaryLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/80" />
              {secondaryLabel}
            </span>
          ) : null}
        </div>
      </div>

      {!hasData ? (
        <p className="mt-8 text-center text-sm text-[var(--muted)]">{emptyMessage}</p>
      ) : (
        <div className="mt-6 flex h-44 items-end gap-1.5 sm:gap-2">
          {display.map((point) => {
            const h1 = Math.max(2, Math.round((point.value / max) * 100));
            const h2 = Math.max(
              point.secondary ? 2 : 0,
              Math.round(((point.secondary ?? 0) / max) * 100)
            );
            return (
              <div
                key={point.key}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                title={`${point.label}: ${point.value}${
                  point.secondary != null ? ` / ${point.secondary}` : ""
                }`}
              >
                <div className="flex h-36 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-full max-w-[14px] rounded-t-sm bg-[var(--accent)]/85 transition group-hover:bg-[var(--accent)]"
                    style={{ height: `${h1}%` }}
                  />
                  {secondaryLabel ? (
                    <div
                      className="w-full max-w-[14px] rounded-t-sm bg-emerald-500/70 transition group-hover:bg-emerald-500"
                      style={{ height: `${h2}%` }}
                    />
                  ) : null}
                </div>
                <span className="hidden truncate text-[10px] text-[var(--muted)] sm:block">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
