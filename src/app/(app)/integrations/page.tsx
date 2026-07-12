import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { IntegrationList } from "@/components/integrations/integration-list";
import { listIntegrations } from "@/lib/integrations";

export default async function IntegrationsPage() {
  const user = await requireUser({ permission: "integrations:manage" });
  if (!user.companyId) redirect("/onboarding");

  const integrations = await listIntegrations(user.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect booking channels, calendars, messaging, and file storage. Sync state stays observable."
      />
      <IntegrationList integrations={integrations} />
    </div>
  );
}
