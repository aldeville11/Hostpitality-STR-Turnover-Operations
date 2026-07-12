import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { buildLaunchChecklist } from "@/lib/launch";
import { LaunchPageHeader } from "@/components/launch/launch-page-header";
import { ExecutiveReadinessSummary } from "@/components/launch/executive-summary";
import { LaunchChecklist } from "@/components/launch/launch-checklist";
import { SmokeTestResults } from "@/components/launch/smoke-test-results";
import { PerformancePanel } from "@/components/launch/performance-panel";
import { DataIntegrityPanel } from "@/components/launch/data-integrity-panel";
import { ObservabilityPanel } from "@/components/launch/observability-panel";
import {
  formatValidatedAt,
  presentLaunchGates,
  presentReadinessSummary,
} from "@/components/launch/launch-presentation";

export default async function LaunchPage() {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) redirect("/onboarding");

  const checklist = await buildLaunchChecklist(user.companyId);
  const validatedAt = new Date().toISOString();
  const summary = presentReadinessSummary(checklist);
  const gates = presentLaunchGates(checklist);
  const openBlockers = gates
    .filter((g) => g.status === "failed" || g.status === "blocked")
    .map((g) => g.name);

  return (
    <div className="space-y-6">
      <LaunchPageHeader
        ready={checklist.ready}
        scorePct={summary.score}
        validatedAtLabel={formatValidatedAt(validatedAt)}
        ownerName={user.name}
      />

      <ExecutiveReadinessSummary
        summary={summary}
        validatedAtLabel={formatValidatedAt(validatedAt)}
        openBlockers={openBlockers}
      />

      <LaunchChecklist items={checklist.items} />

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
