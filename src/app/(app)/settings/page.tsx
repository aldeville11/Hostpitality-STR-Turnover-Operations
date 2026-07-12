import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge, Button } from "@/components/ui";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getSettingsOverview, SETTINGS_SECTION_DESCRIPTIONS, SETTINGS_SECTIONS } from "@/lib/settings";
import { processJobsAction } from "@/lib/actions";

export default async function SettingsPage() {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getSettingsOverview(user.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin & settings"
        description="Configure company profile, permissions, system defaults, and review audit history."
      />

      <SettingsNav active="overview" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={data.counts.users} />
        <StatCard label="Active properties" value={data.counts.properties} />
        <StatCard label="Connected integrations" value={data.counts.integrations} />
        <StatCard label="Admin audit events" value={data.counts.auditCount} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Company
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Name" value={data.company.name} />
            <Row label="Brand" value={data.company.brandName ?? data.company.name} />
            <Row label="Timezone" value={data.company.timezone} />
            <Row
              label="Support"
              value={data.company.supportEmail ?? data.company.contactName ?? "—"}
            />
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Onboarded</dt>
              <dd>
                <Badge tone={data.company.onboardedAt ? "success" : "warning"}>
                  {data.company.onboardedAt ? "Complete" : "Incomplete"}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Feature flags
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(data.company.systemSettings.featureFlags).map(([key, on]) => (
              <li key={key} className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted)]">{key}</span>
                <Badge tone={on ? "success" : "neutral"}>{on ? "On" : "Off"}</Badge>
              </li>
            ))}
          </ul>
          <form action={processJobsAction} className="mt-4">
            <Button type="submit" variant="outline" size="sm">
              Process due jobs
            </Button>
          </form>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Settings areas
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_SECTIONS.map((section) => (
            <Link
              key={section}
              href={`/settings/${section}`}
              className="rounded-xl border border-[var(--border)] px-4 py-3 transition hover:border-[var(--accent)]/40"
            >
              <p className="font-medium capitalize">{section}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {SETTINGS_SECTION_DESCRIPTIONS[section]}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
