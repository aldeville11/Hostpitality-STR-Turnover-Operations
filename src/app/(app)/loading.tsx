export default function AppLoading() {
  return (
    <div className="space-y-4 animate-pulse p-1">
      <div className="h-8 w-48 rounded-lg bg-[var(--surface-2)]" />
      <div className="h-4 w-96 max-w-full rounded bg-[var(--surface-2)]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60"
          />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60" />
    </div>
  );
}
