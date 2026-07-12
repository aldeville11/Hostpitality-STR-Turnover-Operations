import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const initialStep = user?.companyId ? "setup" : "company";

  if (user?.company?.onboardedAt) {
    redirect("/dashboard");
  }

  return <OnboardingClient initialStep={initialStep} />;
}
