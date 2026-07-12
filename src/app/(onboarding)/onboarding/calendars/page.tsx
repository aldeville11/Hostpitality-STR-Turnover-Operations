import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOnboardingContext } from "@/lib/onboarding";
import { CalendarsStepClient } from "./calendars-client";

export default async function OnboardingCalendarsPage() {
  const user = await getCurrentUser();
  if (!user?.companyId) redirect("/signup");
  const ctx = await getOnboardingContext(user.companyId);

  return (
    <CalendarsStepClient
      properties={ctx.company.properties.map((p) => ({
        id: p.id,
        name: p.name,
        unitCode: p.unitCode,
        calendarUrl: p.calendarUrl,
        bookingSource: p.bookingSource,
      }))}
    />
  );
}
