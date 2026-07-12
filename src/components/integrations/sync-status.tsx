import { Badge } from "@/components/ui";
import { formatSyncTime, integrationStatusTone } from "@/lib/integrations";

export function SyncStatus({
  status,
  enabled,
  lastSyncAt,
  lastSuccessAt,
  lastError,
  externalAccount,
}: {
  status: string;
  enabled: boolean;
  lastSyncAt: Date | string | null;
  lastSuccessAt: Date | string | null;
  lastError: string | null;
  externalAccount: string | null;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Sync status
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={integrationStatusTone(status)}>{status}</Badge>
        <Badge tone={enabled ? "success" : "warning"}>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Account</dt>
          <dd className="font-medium">{externalAccount ?? "Not connected"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Last sync</dt>
          <dd className="font-medium">{formatSyncTime(lastSyncAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Last success</dt>
          <dd className="font-medium">{formatSyncTime(lastSuccessAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">Last error</dt>
          <dd className={lastError ? "font-medium text-rose-700" : "font-medium"}>
            {lastError ?? "None"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
