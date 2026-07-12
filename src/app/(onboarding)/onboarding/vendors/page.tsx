import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { VendorsStepClient } from "./vendors-client";

export default async function OnboardingVendorsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <VendorsStepClient
      vendors={ctx.company.vendors.map((v) => ({
        id: v.id,
        name: v.name,
        email: v.email,
        type: v.type,
        phone: v.phone,
      }))}
    />
  );
}
