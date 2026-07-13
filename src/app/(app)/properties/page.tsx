import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listProperties } from "@/lib/properties";
import { PageHeader } from "@/components/ui";
import { PropertyList } from "@/components/properties/property-list";
import { CreatePropertyForm } from "@/components/properties/create-property-form";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; active?: string }>;
}) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) redirect("/onboarding");

  const filters = await searchParams;
  const properties = await listProperties(user.companyId, user.accessScope);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Properties"
        description="STR units with operational context — calendars, SOPs, SOWs, and default cleaners."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <PropertyList properties={properties} filters={filters} />
        </div>
        <CreatePropertyForm />
      </div>
    </div>
  );
}
