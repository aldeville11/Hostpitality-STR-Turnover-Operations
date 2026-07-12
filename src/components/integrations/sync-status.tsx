import { DetailFactGrid, DetailSection, StatusBadge } from "@/components/ui";
import { formatSyncTime } from "@/lib/integrations";
import { mapIntegrationStatus } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

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
    <DetailSection
      title="Sync & health"
      description="Connection state, last sync times, and the most recent error."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={mapIntegrationStatus(status)}>
            {statusLabel(status)}
          </StatusBadge>
          <StatusBadge status={enabled ? "healthy" : "degraded"}>
            {enabled ? "Enabled" : "Disabled"}
          </StatusBadge>
        </div>
      }
    >
      <DetailFactGrid
        items={[
          { label: "Account", value: externalAccount ?? "Not connected" },
          { label: "Last sync", value: formatSyncTime(lastSyncAt) },
          { label: "Last success", value: formatSyncTime(lastSuccessAt) },
          {
            label: "Last error",
            value: lastError ? (
              <span className="text-[var(--danger)]">{lastError}</span>
            ) : (
              "None"
            ),
          },
        ]}
      />
    </DetailSection>
  );
}
