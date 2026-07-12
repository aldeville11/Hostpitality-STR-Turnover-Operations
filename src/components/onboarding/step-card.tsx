import type { ReactNode } from "react";

export function StepCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
      {actions ? <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">{actions}</div> : null}
    </section>
  );
}
