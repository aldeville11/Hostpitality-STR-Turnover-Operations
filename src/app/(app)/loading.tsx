export default function AppLoading() {
  return (
    <div className="space-y-4 p-1" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--surface-2)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]" />
    </div>
  );
}
