import { cn } from "@/lib/utils";

export function ReadinessMeter({
  score,
  ready,
  className,
}: {
  score: number;
  ready: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = ready
    ? "var(--success)"
    : clamped >= 70
      ? "var(--warning)"
      : "var(--danger)";

  return (
    <div
      className={cn("relative inline-flex h-28 w-28 items-center justify-center", className)}
      role="img"
      aria-label={`Launch readiness ${clamped} percent`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
          {clamped}%
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          Ready
        </span>
      </div>
    </div>
  );
}
