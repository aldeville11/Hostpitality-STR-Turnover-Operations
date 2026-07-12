import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui";
import { createPropertyAction, syncCalendarAction } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function PropertiesPage() {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) redirect("/onboarding");

  const [properties, sops, sows, owners] = await Promise.all([
    prisma.property.findMany({
      where: { companyId: user.companyId },
      include: { sop: true, sowTemplate: true, owner: true, turnovers: { take: 1, orderBy: { windowStart: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.sop.findMany({ where: { companyId: user.companyId, active: true } }),
    prisma.sowTemplate.findMany({ where: { companyId: user.companyId, active: true } }),
    prisma.owner.findMany({ where: { companyId: user.companyId } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Units, calendar sync, and linked SOP / SOW playbooks."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          {properties.length === 0 ? (
            <EmptyState title="No properties yet" description="Add your first property to begin turnovers." />
          ) : (
            properties.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                      {p.name}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {p.unitCode} · {p.address}, {p.city}, {p.state}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="accent">{p.bedrooms} bed / {p.bathrooms} bath</Badge>
                      {p.sop ? <Badge>{p.sop.name}</Badge> : <Badge tone="warning">No SOP</Badge>}
                      {p.sowTemplate ? <Badge tone="info">{p.sowTemplate.name}</Badge> : null}
                      {p.owner ? <Badge tone="neutral">Owner: {p.owner.name}</Badge> : null}
                    </div>
                  </div>
                  <form action={syncCalendarAction}>
                    <input type="hidden" name="propertyId" value={p.id} />
                    <input type="hidden" name="hoursUntilCheckout" value="4" />
                    <Button type="submit" size="sm" variant="outline">
                      Sync calendar → turnover
                    </Button>
                  </form>
                </div>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Calendar: {p.calendarUrl ?? "Not set"}
                  {p.calendarSyncedAt ? ` · Last sync ${formatDateTime(p.calendarSyncedAt)}` : ""}
                </p>
              </div>
            ))
          )}
        </div>

        <form
          action={createPropertyAction}
          className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Add property</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="unitCode">Unit code</Label>
            <Input id="unitCode" name="unitCode" required />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="bedrooms">Beds</Label>
              <Input id="bedrooms" name="bedrooms" type="number" defaultValue={1} />
            </div>
            <div>
              <Label htmlFor="bathrooms">Baths</Label>
              <Input id="bathrooms" name="bathrooms" type="number" step="0.5" defaultValue={1} />
            </div>
          </div>
          <div>
            <Label htmlFor="calendarUrl">Calendar URL</Label>
            <Input id="calendarUrl" name="calendarUrl" />
          </div>
          <div>
            <Label htmlFor="sopId">SOP</Label>
            <Select id="sopId" name="sopId" defaultValue="">
              <option value="">Select SOP</option>
              {sops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sowTemplateId">SOW template</Label>
            <Select id="sowTemplateId" name="sowTemplateId" defaultValue="">
              <option value="">Select SOW</option>
              {sows.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ownerId">Owner</Label>
            <Select id="ownerId" name="ownerId" defaultValue="">
              <option value="">Select owner</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full">
            Save property
          </Button>
          <Link href="/turnovers" className="block text-center text-sm text-[var(--accent)]">
            Go to turnovers
          </Link>
        </form>
      </div>
    </div>
  );
}
