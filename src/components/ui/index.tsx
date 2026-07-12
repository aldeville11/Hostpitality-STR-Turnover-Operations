import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-[background,border,opacity,transform] duration-[var(--transition)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px",
        size === "sm" && "min-h-8 px-2.5 py-1.5 text-xs",
        size === "md" && "px-3.5 py-2 text-sm",
        size === "lg" && "min-h-11 px-5 py-2.5 text-base",
        variant === "primary" &&
          "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
        variant === "secondary" &&
          "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--border)]",
        variant === "outline" &&
          "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]",
        variant === "ghost" &&
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
        variant === "danger" && "bg-[var(--danger)] text-white hover:bg-rose-800",
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--muted)] transition-[border,box-shadow] duration-[var(--transition)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/20 disabled:bg-[var(--surface-2)] disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--muted)] transition-[border,box-shadow] duration-[var(--transition)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/20 disabled:bg-[var(--surface-2)] disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] transition-[border,box-shadow] duration-[var(--transition)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]/20 disabled:bg-[var(--surface-2)] disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  htmlFor,
  hint,
  required,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]"
      >
        {children}
        {required ? <span className="ml-0.5 text-[var(--danger)]">*</span> : null}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium",
        tone === "neutral" &&
          "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]",
        tone === "success" &&
          "border-emerald-200/80 bg-[var(--success-soft)] text-[var(--success)]",
        tone === "warning" &&
          "border-amber-200/80 bg-[var(--warning-soft)] text-[var(--warning)]",
        tone === "danger" &&
          "border-rose-200/80 bg-[var(--danger-soft)] text-[var(--danger)]",
        tone === "info" && "border-sky-200/80 bg-[var(--info-soft)] text-[var(--info)]",
        tone === "accent" &&
          "border-teal-200/80 bg-[var(--accent-soft)] text-[var(--accent-strong)]"
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-[14.5px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
        {meta ? <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
      <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4",
        emphasis && "border-[var(--accent)]/30 bg-[var(--accent-soft)]/40"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-[family-name:var(--font-display)] font-semibold tabular-nums text-[var(--text-primary)]",
          emphasis ? "text-3xl" : "text-2xl"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface-raised)] px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ModuleCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
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
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export { StatusBadge, statusLabel, statusTone } from "./status";
export type { OperationalStatus } from "./status";
