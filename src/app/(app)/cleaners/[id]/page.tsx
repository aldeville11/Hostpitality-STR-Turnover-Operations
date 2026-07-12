import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getCleanerDetail } from "@/lib/cleaners";
import { Button, PageHeader } from "@/components/ui";
import { CleanerDetail } from "@/components/cleaners/cleaner-detail";

export default async function CleanerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");
  if (!can(user.role, "assignments:manage") && !can(user.role, "turnovers:manage")) {
    redirect("/dashboard");
  }

  const data = await getCleanerDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.vendor.name}
        description={`${data.vendor.type} · Assignment & coverage`}
        actions={
          <Link href="/cleaners">
            <Button variant="outline" size="sm">
              All cleaners
            </Button>
          </Link>
        }
      />
      <CleanerDetail data={data} canManage={can(user.role, "assignments:manage")} />
    </div>
  );
}
