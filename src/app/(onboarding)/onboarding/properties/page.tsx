import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { PropertiesStepClient } from "./properties-client";

export default async function OnboardingPropertiesPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <PropertiesStepClient
      properties={ctx.company.properties.map((p) => ({
        id: p.id,
        name: p.name,
        unitCode: p.unitCode,
        address: p.address,
        city: p.city,
        state: p.state,
      }))}
    />
  );
}
