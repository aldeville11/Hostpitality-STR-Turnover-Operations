import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, Input, Label, PageHeader, Select } from "@/components/ui";
import { addTeamMemberAction, processJobsAction } from "@/lib/actions";
import { AGENT_LABELS } from "@/lib/agents";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Role } from "@/lib/types";
import { formatDateTime, parseJson, statusLabel } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser({ permission: "settings:manage" });
  if (!user.companyId) redirect("/onboarding");

  const [company, members, audits, jobs, agents] = await Promise.all([
    prisma.company.findUnique({ where: { id: user.companyId } }),
    prisma.teamMember.findMany({
      where: { companyId: user.companyId },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { companyId: user.companyId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.backgroundJob.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    Object.entries(AGENT_LABELS),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Company profile, team RBAC roster, background jobs, and audit trail."
      />

      <div className="grid gap-6 xl:grid-cols-2">
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
              <dd className="font-medium">
                {company?.onboardedAt ? formatDateTime(company.onboardedAt) : "Incomplete"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Background jobs
            </h2>
            <form action={processJobsAction}>
              <Button type="submit" size="sm" variant="outline">
                Process due jobs
              </Button>
            </form>
          </div>
          <div className="mt-3 space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{job.type}</p>
                  <p className="text-xs text-[var(--muted)]">Run {formatDateTime(job.runAt)}</p>
                </div>
                <Badge
                  tone={
                    job.status === "COMPLETED"
                      ? "success"
                      : job.status === "FAILED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {statusLabel(job.status)}
                </Badge>
              </div>
            ))}
            {jobs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No jobs queued.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Team & RBAC roles
          </h2>
          <div className="mb-4 space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {m.email} · {parseJson<string[]>(m.skills, []).join(", ") || "No skills listed"}
                  </p>
                </div>
                <Badge>{ROLE_LABELS[m.role as Role] ?? m.role}</Badge>
              </div>
            ))}
          </div>
          <form action={addTeamMemberAction} className="space-y-2 border-t border-[var(--border)] pt-4">
            <p className="text-sm font-semibold">Add cleaner / vendor</p>
            <Input name="name" placeholder="Name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" placeholder="Phone" />
            <Select name="role" defaultValue="CLEANER">
              <option value="CLEANER">Cleaner</option>
              <option value="VENDOR">Vendor / Handyman</option>
              <option value="CLEANING_COORDINATOR">Cleaning Coordinator</option>
              <option value="PROPERTY_MANAGER">Property Manager</option>
              <option value="OPS_MANAGER">Ops Manager</option>
            </Select>
            <Input name="skills" placeholder="Skills (comma-separated)" />
            <Button type="submit" className="w-full">
              Add team member
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            AI agents
          </h2>
          <p className="mb-3 text-sm text-[var(--muted)]">
            All agent mutations require explicit approval before execution.
          </p>
          <div className="space-y-1">
            {agents.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <Badge tone="accent">Approval gated</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5 xl:col-span-2">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
            Audit log
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--muted)]">
                <tr>
                  <th className="pb-2 pr-3 font-semibold">When</th>
                  <th className="pb-2 pr-3 font-semibold">Actor</th>
                  <th className="pb-2 pr-3 font-semibold">Action</th>
                  <th className="pb-2 pr-3 font-semibold">Entity</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((log) => (
                  <tr key={log.id} className="border-t border-[var(--border)]">
                    <td className="py-2 pr-3 text-[var(--muted)]">{formatDateTime(log.createdAt)}</td>
                    <td className="py-2 pr-3">{log.user?.name ?? "System"}</td>
                    <td className="py-2 pr-3 font-medium">{log.action}</td>
                    <td className="py-2 pr-3 text-[var(--muted)]">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
