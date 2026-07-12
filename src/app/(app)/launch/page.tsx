import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui";
import { buildLaunchChecklist } from "@/lib/launch";
import { LaunchChecklist } from "@/components/launch/launch-checklist";
import { SmokeTestResults } from "@/components/launch/smoke-test-results";
import { PerformancePanel } from "@/components/launch/performance-panel";
import { DataIntegrityPanel } from "@/components/launch/data-integrity-panel";
import { ObservabilityPanel } from "@/components/launch/observability-panel";

export default async function LaunchPage() {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) redirect("/onboarding");

  const checklist = await buildLaunchChecklist(user.companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Launch readiness"
        description="Validate data integrity, run smoke tests, and review operational health before shipping."
        actions={
          <Badge tone={checklist.ready ? "success" : "warning"}>
            {checklist.ready ? "Ship-ready" : "Needs attention"}
          </Badge>
        }
      />

      <LaunchChecklist
        items={checklist.items}
        ready={checklist.ready}
        score={checklist.score}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataIntegrityPanel checks={checklist.integrity} />
        <ObservabilityPanel snapshot={checklist.observability} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SmokeTestResults initial={checklist.smoke} />
        <PerformancePanel snapshot={checklist.performance} />
      </div>
    </div>
  );
}
