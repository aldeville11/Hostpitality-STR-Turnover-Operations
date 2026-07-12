import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Centralized operational status language. */
export type OperationalStatus =
  | "healthy"
  | "at_risk"
  | "blocked"
  | "failed"
  | "pending"
  | "running"
  | "complete"
  | "passed"
  | "needs_review"
  | "rejected"
  | "assigned"
  | "unassigned"
  | "confirmed"
  | "declined"
  | "connected"
  | "degraded"
  | "error"
  | "disconnected"
  | "warning"
  | "not_checked";

const LABELS: Record<OperationalStatus, string> = {
  healthy: "Healthy",
  at_risk: "At risk",
  blocked: "Blocked",
  failed: "Failed",
  pending: "Pending",
  running: "Running",
  complete: "Complete",
  passed: "Passed",
  needs_review: "Needs review",
  rejected: "Rejected",
  assigned: "Assigned",
  unassigned: "Unassigned",
  confirmed: "Confirmed",
  declined: "Declined",
  connected: "Connected",
  degraded: "Degraded",
  error: "Error",
  disconnected: "Disconnected",
  warning: "Warning",
  not_checked: "Not checked",
};

const TONES: Record<
  OperationalStatus,
  "neutral" | "success" | "warning" | "danger" | "info" | "accent"
> = {
  healthy: "success",
  at_risk: "warning",
  blocked: "danger",
  failed: "danger",
  pending: "neutral",
  running: "info",
  complete: "success",
  passed: "success",
  needs_review: "warning",
  rejected: "danger",
  assigned: "accent",
  unassigned: "warning",
  confirmed: "success",
  declined: "danger",
  connected: "success",
  degraded: "warning",
  error: "danger",
  disconnected: "neutral",
  warning: "warning",
  not_checked: "neutral",
};

export function statusLabel(status: OperationalStatus) {
  return LABELS[status];
}

export function statusTone(status: OperationalStatus) {
  return TONES[status];
}

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]",
  success: "bg-[var(--success-soft)] text-[var(--success)] border-emerald-200/80",
  warning: "bg-[var(--warning-soft)] text-[var(--warning)] border-amber-200/80",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-rose-200/80",
  info: "bg-[var(--info-soft)] text-[var(--info)] border-sky-200/80",
  accent: "bg-[var(--accent-soft)] text-[var(--accent-strong)] border-teal-200/80",
};

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: OperationalStatus;
  children?: ReactNode;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]",
        TONE_CLASS[tone],
        className
      )}
      role="status"
      aria-label={`Status: ${statusLabel(status)}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          tone === "success" && "bg-[var(--success)]",
          tone === "warning" && "bg-[var(--warning)]",
          tone === "danger" && "bg-[var(--danger)]",
          tone === "info" && "bg-[var(--info)]",
          tone === "accent" && "bg-[var(--accent)]",
          tone === "neutral" && "bg-[var(--muted)]"
        )}
        aria-hidden
      />
      {children ?? statusLabel(status)}
    </span>
  );
}
