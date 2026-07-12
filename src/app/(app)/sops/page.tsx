import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Input, Label, PageHeader, Textarea } from "@/components/ui";
import { createSopAction } from "@/lib/actions";

export default async function SopsPage() {
  const user = await requireUser({ permission: "sops:manage" });
  if (!user.companyId) redirect("/onboarding");

  const sops = await prisma.sop.findMany({
    where: { companyId: user.companyId },
    include: { steps: { orderBy: { sortOrder: "asc" } }, properties: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="SOPs"
        description="Property playbooks covering prep, room-by-room work, photos, deep-clean cadence, and sign-off."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {sops.length === 0 ? (
            <EmptyState title="No SOPs" description="Upload or create your first standard operating procedure." />
          ) : (
            sops.map((sop) => {
              const sections = Array.from(new Set(sop.steps.map((s) => s.section)));
              return (
                <article
                  key={sop.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                        {sop.name}
                      </h2>
                      <p className="text-sm text-[var(--muted)]">{sop.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge>v{sop.version}</Badge>
                      <Badge tone="info">Deep clean every {sop.deepCleanEveryN}</Badge>
                      <Badge tone="accent">{sop.properties.length} properties</Badge>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {sections.map((section) => (
                      <div key={section} className="rounded-xl border border-[var(--border)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                          {section}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {sop.steps
                            .filter((s) => s.section === section)
                            .map((step) => (
                              <li key={step.id} className="flex items-start justify-between gap-2">
                                <span>{step.title}</span>
                                {step.requiresPhoto ? <Badge tone="info">Photo</Badge> : null}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form
          action={createSopAction}
          className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Create SOP</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          <p className="text-xs text-[var(--muted)]">
            Creates a starter playbook with prep, room-by-room, and sign-off sections. Expand steps after
            save.
          </p>
          <Button type="submit" className="w-full">
            Save SOP
          </Button>
        </form>
      </div>
    </div>
  );
}
