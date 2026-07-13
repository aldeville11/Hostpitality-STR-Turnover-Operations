import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  PageHeader,
  Badge,
  Stat,
  ModuleCard,
  DetailFactGrid,
  StatusBadge,
} from "@/components/ui";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getSettingsOverview, SETTINGS_SECTION_DESCRIPTIONS, SETTINGS_SECTIONS } from "@/lib/settings";

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
        <Stat label="Users" value={data.counts.users} />
        <Stat label="Active properties" value={data.counts.properties} />
        <Stat label="Connected integrations" value={data.counts.integrations} />
        <Stat label="Admin audit events" value={data.counts.auditCount} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ModuleCard title="Company" description="Operating identity and onboarding state.">
          <DetailFactGrid
            items={[
              { label: "Name", value: data.company.name },
              { label: "Brand", value: data.company.brandName ?? data.company.name },
              { label: "Timezone", value: data.company.timezone },
              {
                label: "Support",
                value: data.company.supportEmail ?? data.company.contactName ?? "—",
              },
              {
                label: "Onboarded",
                value: (
                  <StatusBadge status={data.company.onboardedAt ? "complete" : "needs_review"}>
                    {data.company.onboardedAt ? "Complete" : "Incomplete"}
                  </StatusBadge>
                ),
              },
            ]}
          />
        </ModuleCard>

        <ModuleCard
          title="Feature flags"
          description="Company-level capability toggles."
        >
          <ul className="space-y-2 text-sm">
            {Object.entries(data.company.systemSettings.featureFlags).map(([key, on]) => (
              <li
                key={key}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2"
              >
                <span className="text-[var(--text-secondary)]">{key}</span>
                <Badge tone={on ? "success" : "neutral"}>{on ? "On" : "Off"}</Badge>
              </li>
            ))}
          </ul>
        </ModuleCard>
      </div>

      <ModuleCard
        title="Settings areas"
        description="Open a section to manage company, branding, access, and system defaults."
        actions={
          <Link
            href="/launch"
            className="text-sm font-medium text-[var(--accent-strong)] hover:underline"
          >
            Open launch readiness →
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_SECTIONS.map((section) => (
            <Link
              key={section}
              href={`/settings/${section}`}
              className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface)]"
            >
              <p className="font-medium capitalize text-[var(--text-primary)]">{section}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {SETTINGS_SECTION_DESCRIPTIONS[section]}
              </p>
            </Link>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
