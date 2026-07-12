import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getCleanerDetail } from "@/lib/cleaners";
import { PageHeader } from "@/components/ui";
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
          <Link
            href="/cleaners"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            All cleaners
          </Link>
        }
      />
      <CleanerDetail data={data} canManage={can(user.role, "assignments:manage")} />
    </div>
  );
}
