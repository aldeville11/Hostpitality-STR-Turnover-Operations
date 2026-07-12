import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { SopsStepClient } from "./sops-client";

export default async function OnboardingSopsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <SopsStepClient
      sops={ctx.company.sops.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      }))}
    />
  );
}
