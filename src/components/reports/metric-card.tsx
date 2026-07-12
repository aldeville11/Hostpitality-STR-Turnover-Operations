export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
        ? "text-amber-700"
        : tone === "danger"
          ? "text-rose-700"
          : tone === "accent"
            ? "text-[var(--accent-strong)]"
            : "text-[var(--ink)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums ${toneClass}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
