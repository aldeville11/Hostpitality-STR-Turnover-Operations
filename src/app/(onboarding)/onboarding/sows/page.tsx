import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { SowsStepClient } from "./sows-client";

export default async function OnboardingSowsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <SowsStepClient
      sows={ctx.company.sows.map((s) => ({
        id: s.id,
        name: s.name,
        standardScope: s.standardScope,
        slaMinutes: s.slaMinutes,
      }))}
    />
  );
}
