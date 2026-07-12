import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");
  if (user.company && !user.company.onboardedAt) {
    // allow settings/onboarding access via /onboarding only
  }

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role as import("@/lib/types").Role,
        companyName: user.company?.name ?? "Company",
      }}
    >
      {children}
    </AppShell>
  );
}
