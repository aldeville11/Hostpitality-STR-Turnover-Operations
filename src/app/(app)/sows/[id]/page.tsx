import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSowDetail } from "@/lib/sows";
import { PageHeader } from "@/components/ui";
import { SowEditor } from "@/components/sows/sow-editor";

export default async function SowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getSowDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.sow.name}
        description={`v${data.sow.version} · Service scope template`}
        actions={
          <Link
            href="/sows"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            All SOW templates
          </Link>
        }
      />
      <SowEditor
        sow={data.sow}
        initialDocument={data.document}
        allProperties={data.allProperties}
        versions={data.sow.versions}
        canManage={can(user.role, "sow:manage")}
      />
    </div>
  );
}
