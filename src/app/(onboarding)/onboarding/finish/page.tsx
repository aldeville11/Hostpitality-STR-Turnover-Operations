import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext, validateActivation } from "@/lib/onboarding";
import { FinishStepClient } from "./finish-client";

export default async function OnboardingFinishPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  const blocked = validateActivation({
    properties: ctx.counts.properties,
    sops: ctx.counts.sops,
    sows: ctx.counts.sows,
    vendors: ctx.counts.vendors,
    progress: {
      ...ctx.progress,
      company: ctx.progress.company ?? "complete",
    },
  });

  return (
    <FinishStepClient
      summary={{
        company: ctx.company.name,
        properties: ctx.counts.properties,
        sops: ctx.counts.sops,
        sows: ctx.counts.sows,
        vendors: ctx.counts.vendors,
      }}
      blocked={blocked}
    />
  );
}
