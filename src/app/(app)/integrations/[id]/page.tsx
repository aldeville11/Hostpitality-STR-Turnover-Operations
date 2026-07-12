import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Badge } from "@/components/ui";
import { ConnectionPanel } from "@/components/integrations/connection-panel";
import { SyncStatus } from "@/components/integrations/sync-status";
import { WebhookLog } from "@/components/integrations/webhook-log";
import { FileLinkPanel } from "@/components/integrations/file-link-panel";
import {
  formatSyncTime,
  getIntegrationDetail,
  integrationStatusTone,
} from "@/lib/integrations";

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
          `${integration.category} integration · ${integration.provider}`
        }
        actions={
          <Link
            href="/integrations"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            All integrations
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={integrationStatusTone(integration.status)}>{integration.status}</Badge>
        <Badge tone="neutral">{integration.category}</Badge>
        <Badge tone="info">{integration.provider}</Badge>
        {integration.enabled ? (
          <Badge tone="success">Enabled</Badge>
        ) : (
          <Badge tone="warning">Disabled</Badge>
        )}
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
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Imported calendar events
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Shown alongside turnover scheduling. Checkout-window events reuse existing bookings
                to avoid duplicate turnovers.
              </p>
              {integration.calendarEvents.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted)]">No imported events yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {integration.calendarEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
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
            </section>
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
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Property mapping
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Sync uses active properties and unit codes to normalize inbound reservations.
            </p>
            <ul className="mt-4 space-y-2">
              {properties.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <Link href={`/properties/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {p.unitCode} · source {p.bookingSource} · calendar {p.calendarStatus}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {integration.category !== "STORAGE" && integration.storedFiles.length > 0 ? (
            <FileLinkPanel files={integration.storedFiles} canManage={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
