import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getSopDetail } from "@/lib/sops";
import { PageHeader } from "@/components/ui";
import { SopEditor } from "@/components/sops/sop-editor";

export default async function SopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getSopDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.sop.name}
        description={`v${data.sop.version} · Structured turnover playbook`}
        actions={
          <Link
            href="/sops"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            All SOPs
          </Link>
        }
      />
      <SopEditor
        sop={data.sop}
        initialDocument={data.document}
        allProperties={data.allProperties}
        versions={data.sop.versions}
        canManage={can(user.role, "sops:manage")}
      />
    </div>
  );
}
