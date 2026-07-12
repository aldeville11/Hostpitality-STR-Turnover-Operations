import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Badge, Button } from "@/components/ui";
import { processJobsAction } from "@/lib/actions";

export default async function SettingsPage() {
  const user = await requireUser({ permission: "settings:manage" });

  const [company, jobCount, auditCount] = await Promise.all([
    prisma.company.findUnique({ where: { id: user.companyId! } }),
    prisma.backgroundJob.count({ where: { companyId: user.companyId! } }),
    prisma.auditLog.count({ where: { companyId: user.companyId! } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Company profile and foundation utilities for Phase 1."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Company</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Name</dt>
              <dd className="font-medium">{company?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Slug</dt>
              <dd className="font-medium">{company?.slug}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Timezone</dt>
              <dd className="font-medium">{company?.timezone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted)]">Onboarded</dt>
              <dd>
                <Badge tone={company?.onboardedAt ? "success" : "warning"}>
                  {company?.onboardedAt ? "Complete" : "Incomplete"}
                </Badge>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Foundation status
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Background jobs</span>
              <span className="font-medium">{jobCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Audit log entries</span>
              <span className="font-medium">{auditCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Signed-in role</span>
              <span className="font-medium">{user.role}</span>
            </div>
          </div>
          <form action={processJobsAction} className="mt-4">
            <Button type="submit" variant="outline" size="sm">
              Process due jobs
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
