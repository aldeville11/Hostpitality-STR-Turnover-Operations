import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  Badge,
  DetailSection,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { ConnectionPanel } from "@/components/integrations/connection-panel";
import { SyncStatus } from "@/components/integrations/sync-status";
import { WebhookLog } from "@/components/integrations/webhook-log";
import { FileLinkPanel } from "@/components/integrations/file-link-panel";
import { formatSyncTime, getIntegrationDetail } from "@/lib/integrations";
import { mapIntegrationStatus } from "@/lib/status-map";
import { statusLabel } from "@/lib/utils";

export default async function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getIntegrationDetail(user.companyId, id);
  if (!data) notFound();

  const { integration, properties } = data;
  const canManage = can(user.role, "integrations:manage");

  return (
    <div className="space-y-6">
      <PageHeader
        title={integration.name}
        description={
          integration.catalog?.description ??
          `${statusLabel(integration.category)} integration · ${integration.provider}`
        }
        meta={
          <>
            <span>{statusLabel(integration.category)}</span>
            <span>{integration.provider}</span>
            <span>Last sync {formatSyncTime(integration.lastSyncAt)}</span>
          </>
        }
        actions={
          <Link
            href="/integrations"
            className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)]"
          >
            All systems
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={mapIntegrationStatus(integration.status)}>
          {statusLabel(integration.status)}
        </StatusBadge>
        <Badge tone="neutral">{statusLabel(integration.category)}</Badge>
        <Badge tone="info">{integration.provider}</Badge>
        <StatusBadge status={integration.enabled ? "healthy" : "degraded"}>
          {integration.enabled ? "Enabled" : "Disabled"}
        </StatusBadge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <ConnectionPanel
            integrationId={integration.id}
            status={integration.status}
            enabled={integration.enabled}
            externalAccount={integration.externalAccount}
            category={integration.category}
          />

          <SyncStatus
            status={integration.status}
            enabled={integration.enabled}
            lastSyncAt={integration.lastSyncAt}
            lastSuccessAt={integration.lastSuccessAt}
            lastError={integration.lastError}
            externalAccount={integration.externalAccount}
          />

          {integration.category === "CALENDAR" ? (
            <DetailSection
              title="Imported calendar events"
              description="Shown alongside turnover scheduling. Checkout-window events reuse existing bookings to avoid duplicate turnovers."
            >
              {integration.calendarEvents.length === 0 ? (
                <EmptyState
                  title="No imported events yet"
                  description="Connect and sync this calendar to import events."
                />
              ) : (
                <ul className="space-y-2">
                  {integration.calendarEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatSyncTime(event.startsAt)} → {formatSyncTime(event.endsAt)}
                        {event.linkedTurnoverId
                          ? ` · Turnover ${event.linkedTurnoverId.slice(0, 8)}…`
                          : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </DetailSection>
          ) : null}

          {integration.category === "STORAGE" ? (
            <FileLinkPanel
              files={integration.storedFiles}
              canManage={canManage}
              defaultEntityType="Issue"
              defaultEntityId=""
            />
          ) : null}

          <WebhookLog
            webhooks={integration.webhookLogs}
            syncEvents={integration.syncEvents}
          />
        </div>

        <div className="space-y-6">
          <DetailSection
            title="Property mapping"
            description="Sync uses active properties and unit codes to normalize inbound reservations."
          >
            {properties.length === 0 ? (
              <EmptyState
                title="No active properties"
                description="Add properties so inbound reservations can be mapped by unit code."
              />
            ) : (
              <ul className="space-y-2">
                {properties.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/properties/${p.id}`}
                      className="font-medium text-[var(--accent-strong)] hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      {p.unitCode} · source {p.bookingSource} · calendar {p.calendarStatus}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          {integration.category !== "STORAGE" && integration.storedFiles.length > 0 ? (
            <FileLinkPanel files={integration.storedFiles} canManage={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
