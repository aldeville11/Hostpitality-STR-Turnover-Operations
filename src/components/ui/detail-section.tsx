import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent detail-page section used across entity detail views. */
export function DetailSection({
  title,
  description,
  actions,
  children,
  className,
  dense,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  dense?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)]",
          dense ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] md:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className={cn(dense ? "px-4 py-3" : "px-5 py-4")}>{children}</div>
    </section>
  );
}

export function DetailFactGrid({
  items,
}: {
  items: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5"
        >
          <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium text-[var(--text-primary)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
