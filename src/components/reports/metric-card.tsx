import { cn } from "@/lib/utils";

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
      ? "text-[var(--success)]"
      : tone === "warning"
        ? "text-[var(--warning)]"
        : tone === "danger"
          ? "text-[var(--danger)]"
          : tone === "accent"
            ? "text-[var(--accent-strong)]"
            : "text-[var(--text-primary)]";

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4",
        tone === "accent" && "border-[var(--accent)]/30 bg-[var(--accent-soft)]/40"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums",
          toneClass
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
