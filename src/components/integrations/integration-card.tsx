import Link from "next/link";
import { Badge } from "@/components/ui";
import {
  formatSyncTime,
  integrationStatusTone,
  type IntegrationListItem,
} from "@/lib/integrations";

export function IntegrationCard({ integration }: { integration: IntegrationListItem }) {
  const latest = integration.syncEvents[0];

  return (
    <Link
      href={`/integrations/${integration.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 transition hover:border-[var(--accent)]/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {integration.name}
            </p>
            <Badge tone="neutral">{integration.category}</Badge>
            {!integration.enabled ? <Badge tone="warning">Disabled</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {integration.catalog?.description ?? "External service connection"}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Account {integration.externalAccount ?? "—"}
            {" · "}
            Last sync {formatSyncTime(integration.lastSyncAt)}
            {latest ? ` · ${latest.summary}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={integrationStatusTone(integration.status)}>{integration.status}</Badge>
          {integration.lastError ? <Badge tone="danger">Has errors</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
