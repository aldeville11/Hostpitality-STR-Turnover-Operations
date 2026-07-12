import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listProperties } from "@/lib/properties";
import { PageHeader } from "@/components/ui";
import { PropertyList } from "@/components/properties/property-list";
import { CreatePropertyForm } from "@/components/properties/create-property-form";

export default async function PropertiesPage() {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) redirect("/onboarding");

  const properties = await listProperties(user.companyId);

  return (
    <div>
      <PageHeader
        title="Properties"
        description="STR units with operational context — calendars, SOPs, SOWs, and default cleaners."
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PropertyList properties={properties} />
        </div>
        <CreatePropertyForm />
      </div>
    </div>
  );
}
