import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { StepCard } from "@/components/onboarding/step-card";
import { Button, Input, Label, Select } from "@/components/ui";
import { saveCompanyStepAction } from "@/lib/onboarding-actions";
import { redirect } from "next/navigation";

export default async function OnboardingCompanyPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <StepCard
      title="Company profile"
      description="Confirm the operating company that will own properties, SOPs, and vendors."
    >
      <form action={saveCompanyStepAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required defaultValue={ctx.company.name} />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Select id="timezone" name="timezone" defaultValue={ctx.company.timezone}>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="America/Denver">America/Denver</option>
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/New_York">America/New_York</option>
            <option value="UTC">UTC</option>
          </Select>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Created during signup. Update details here, then continue. Progress is saved to the
          database.
        </p>
        <Button type="submit">Save and continue</Button>
      </form>
    </StepCard>
  );
}
