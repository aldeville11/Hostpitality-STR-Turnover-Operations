import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { createSowTemplateAction } from "@/lib/actions";
import { parseJson } from "@/lib/utils";

export default async function SowTemplatesPage() {
  const user = await requireUser({ permission: "sow:manage" });
  if (!user.companyId) redirect("/onboarding");

  const templates = await prisma.sowTemplate.findMany({
    where: { companyId: user.companyId },
    include: { properties: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="SOW Templates"
        description="Scope templates with add-ons, photo proof, SLAs, and damage rules."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {templates.length === 0 ? (
            <EmptyState title="No SOW templates" description="Define your first scope of work template." />
          ) : (
            templates.map((tpl) => {
              const addOns = parseJson<string[]>(tpl.addOns, []);
              const photos = parseJson<string[]>(tpl.photoReqs, []);
              return (
                <article
                  key={tpl.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                        {tpl.name}
                      </h2>
                      <p className="text-sm text-[var(--muted)]">{tpl.description}</p>
                    </div>
                    <Badge tone="accent">{tpl.slaMinutes}m SLA</Badge>
                  </div>
                  <p className="mt-3 text-sm">{tpl.standardScope}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">Add-ons</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {addOns.map((a) => (
                          <Badge key={a}>{a}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-[var(--muted)]">Photo proof</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {photos.map((p) => (
                          <Badge key={p} tone="info">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                    {tpl.damageRules ? <p>Damage: {tpl.damageRules}</p> : null}
                    {tpl.missingItemRules ? <p>Missing items: {tpl.missingItemRules}</p> : null}
                    <p>
                      Sign-off required: {tpl.requiresSignOff ? "Yes" : "No"} · Linked properties:{" "}
                      {tpl.properties.length}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form
          action={createSowTemplateAction}
          className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">New SOW template</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="standardScope">Standard scope</Label>
            <Textarea id="standardScope" name="standardScope" rows={3} required />
          </div>
          <div>
            <Label htmlFor="addOns">Add-ons (one per line)</Label>
            <Textarea id="addOns" name="addOns" rows={3} placeholder="Rush turnover" />
          </div>
          <div>
            <Label htmlFor="photoReqs">Photo requirements (one per line)</Label>
            <Textarea id="photoReqs" name="photoReqs" rows={3} />
          </div>
          <div>
            <Label htmlFor="slaMinutes">SLA minutes</Label>
            <Input id="slaMinutes" name="slaMinutes" type="number" defaultValue={240} />
          </div>
          <div>
            <Label htmlFor="damageRules">Damage rules</Label>
            <Input id="damageRules" name="damageRules" />
          </div>
          <div>
            <Label htmlFor="missingItemRules">Missing-item rules</Label>
            <Input id="missingItemRules" name="missingItemRules" />
          </div>
          <Button type="submit" className="w-full">
            Save template
          </Button>
        </form>
      </div>
    </div>
  );
}
