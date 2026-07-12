import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, Input, Label, PageHeader } from "@/components/ui";
import { createOwnerAction } from "@/lib/actions";
import { formatDateTime } from "@/lib/utils";

export default async function OwnersPage() {
  const user = await requireUser({ permission: "owners:report" });
  if (!user.companyId) redirect("/onboarding");

  const [owners, reports] = await Promise.all([
    prisma.owner.findMany({
      where: { companyId: user.companyId },
      include: { properties: true, reports: { take: 3, orderBy: { createdAt: "desc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.ownerReport.findMany({
      where: { owner: { companyId: user.companyId } },
      include: { owner: true, turnover: { include: { property: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Owners / Reporting"
        description="Owner contacts and turnover completion summaries."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
              Recent owner updates
            </h2>
            {reports.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Closing a turnover with the Owner Update Agent will send summaries here."
              />
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-xl border border-[var(--border)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{report.subject}</p>
                      <Badge tone={report.status === "sent" ? "success" : "neutral"}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--muted)]">{report.body}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      To {report.owner.name} · {report.turnover.property.name}
                      {report.sentAt ? ` · Sent ${formatDateTime(report.sentAt)}` : ""}
                    </p>
                    <Link
                      href={`/turnovers/${report.turnoverId}`}
                      className="text-xs font-medium text-[var(--accent)]"
                    >
                      View turnover
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">Owners</h2>
            <div className="space-y-2">
              {owners.map((owner) => (
                <div
                  key={owner.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{owner.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {owner.email}
                      {owner.phone ? ` · ${owner.phone}` : ""}
                    </p>
                  </div>
                  <Badge>{owner.properties.length} properties</Badge>
                </div>
              ))}
              {owners.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No owners yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        <form
          action={createOwnerAction}
          className="h-fit space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
        >
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Add owner</h2>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" />
          </div>
          <Button type="submit" className="w-full">
            Save owner
          </Button>
        </form>
      </div>
    </div>
  );
}
