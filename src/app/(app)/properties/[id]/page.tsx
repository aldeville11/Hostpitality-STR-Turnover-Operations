import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPropertyDetail } from "@/lib/properties";
import { Button, PageHeader } from "@/components/ui";
import { PropertyDetail } from "@/components/properties/property-detail";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) redirect("/onboarding");

  const data = await getPropertyDetail(user.companyId, id, user.accessScope);
  if (!data) notFound();

  return (
    <div>
      <PageHeader
        title={data.property.name}
        description={`${data.property.unitCode} · Operational context for turnovers`}
        actions={
          <Link href="/properties">
            <Button variant="outline" size="sm">
              All properties
            </Button>
          </Link>
        }
      />
      <PropertyDetail data={data} />
    </div>
  );
}
