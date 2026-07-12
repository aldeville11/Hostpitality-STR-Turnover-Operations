import type { ReactNode } from "react";

/** Enterprise shell for onboarding steps — mirrors ModuleCard structure/tokens. */
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
    <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      </div>
      <div className="space-y-4 px-5 py-4 sm:px-6">{children}</div>
      {actions ? (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-5 py-4 sm:px-6">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
