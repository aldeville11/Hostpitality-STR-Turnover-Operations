export function OnboardingEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 px-4 py-8 text-center">
      <p className="font-medium text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}
