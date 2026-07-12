import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ensureQaInspection, getQaDetail } from "@/lib/qa";
import { PageHeader } from "@/components/ui";
import { QaDetail } from "@/components/qa/qa-detail";

export default async function QaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) redirect("/onboarding");

  // Auto-open inspection for queue statuses so inspectors can start immediately
  const existing = await getQaDetail(user.companyId, id);
  if (!existing) notFound();

  if (
    ["READY_FOR_QA", "NEEDS_REWORK"].includes(existing.turnover.status) &&
    !existing.latestInspection
  ) {
    await ensureQaInspection({
      companyId: user.companyId,
      turnoverId: id,
      userId: user.id,
      actorName: user.name,
      claim: true,
    });
  }

  const data = await getQaDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={`QA · ${data.turnover.property.name}`}
        description={`${data.turnover.property.unitCode} · Inspect against SOP / SOW`}
        actions={
          <Link
            href="/qa"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            QA queue
          </Link>
        }
      />
      <QaDetail data={data} canReview={can(user.role, "qa:review")} />
    </div>
  );
}
