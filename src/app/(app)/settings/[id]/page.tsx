import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SettingsNav } from "@/components/settings/settings-nav";
import { CompanySettingsForm } from "@/components/settings/company-settings";
import { BrandingPanel } from "@/components/settings/branding-panel";
import { SettingsPropertyPanel } from "@/components/settings/property-settings";
import { UserManagement } from "@/components/settings/user-management";
import { RolePermissions } from "@/components/settings/role-permissions";
import { SystemSettingsForm } from "@/components/settings/system-settings";
import { AuditLogPanel } from "@/components/settings/audit-log";
import {
  SETTINGS_SECTION_DESCRIPTIONS,
  SETTINGS_SECTION_LABELS,
  getCompanySettings,
  getSystemSettingsData,
  isSettingsSection,
  listAdminAuditLogs,
  listCompanyUsers,
  listSettingsProperties,
} from "@/lib/settings";
import { prisma } from "@/lib/db";

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSettingsSection(id)) notFound();

  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) redirect("/onboarding");

  let body: ReactNode = null;

  if (id === "company") {
    const company = await getCompanySettings(user.companyId);
    body = <CompanySettingsForm company={company} />;
  } else if (id === "branding") {
    const company = await getCompanySettings(user.companyId);
    body = <BrandingPanel company={company} />;
  } else if (id === "properties") {
    const properties = await listSettingsProperties(user.companyId, user.accessScope);
    body = <SettingsPropertyPanel properties={properties} />;
  } else if (id === "users") {
    const [users, properties] = await Promise.all([
      listCompanyUsers(user.companyId),
      prisma.property.findMany({
        where: { companyId: user.companyId, active: true },
        select: { id: true, name: true, unitCode: true },
        orderBy: { name: "asc" },
      }),
    ]);
    body = <UserManagement users={users} properties={properties} />;
  } else if (id === "roles") {
    body = <RolePermissions />;
  } else if (id === "system") {
    const data = await getSystemSettingsData(user.companyId);
    body = (
      <SystemSettingsForm company={data.company} sops={data.sops} sows={data.sows} />
    );
  } else if (id === "audit") {
    const logs = await listAdminAuditLogs(user.companyId);
    body = <AuditLogPanel logs={logs} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={SETTINGS_SECTION_LABELS[id]}
        description={SETTINGS_SECTION_DESCRIPTIONS[id]}
      />
      <SettingsNav active={id} />
      {body}
    </div>
  );
}
