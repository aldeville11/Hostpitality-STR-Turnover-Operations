import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/properties";
import { PageHeader } from "@/components/ui";
import { PropertyDetail } from "@/components/properties/property-detail";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getPropertyDetail(user.companyId, id);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.property.name}
        description={`${data.property.unitCode} · Operational context for turnovers`}
        actions={
          <Link
            href="/properties"
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-2)]"
          >
            All properties
          </Link>
        }
      />
      <PropertyDetail data={data} />
    </div>
  );
}
