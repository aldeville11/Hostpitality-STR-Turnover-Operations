import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, Input, Label, PageHeader, Select, Textarea } from "@/components/ui";
import {
  addPhotoAction,
  closeTurnoverAction,
  createIssueAction,
  toggleChecklistItemAction,
  approveAgentAction,
} from "@/lib/actions";
import { formatDateTime, parseJson, statusLabel } from "@/lib/utils";
import { agentLabel } from "@/lib/agents";
import Link from "next/link";

export default async function TurnoverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!user.companyId) redirect("/onboarding");

  const turnover = await prisma.turnover.findFirst({
    where: { id, companyId: user.companyId },
    include: {
      property: { include: { owner: true } },
      sop: { include: { steps: true } },
      sowTemplate: true,
      assignments: { include: { teamMember: true } },
      checklist: { orderBy: { sortOrder: "asc" } },
      photos: { orderBy: { createdAt: "desc" } },
      issues: true,
      agentActions: { orderBy: { createdAt: "desc" }, take: 10 },
      booking: true,
    },
  });
  if (!turnover) notFound();

  const scope = parseJson<{ standardScope?: string; photoReqs?: string[] }>(turnover.scopeJson, {});
  const addOns = parseJson<string[]>(turnover.addOnsJson, []);
  const sections = Array.from(new Set(turnover.checklist.map((c) => c.section)));

  return (
    <div>
      <PageHeader
        title={turnover.property.name}
        description={`${turnover.property.unitCode} · Window ${formatDateTime(turnover.windowStart)} – ${formatDateTime(turnover.windowEnd)} · Deadline ${formatDateTime(turnover.deadlineAt)}`}
        actions={
          <>
            <Badge
              tone={
                turnover.status === "COMPLETED"
                  ? "success"
                  : turnover.status === "OVERDUE"
                    ? "danger"
                    : "accent"
              }
            >
              {statusLabel(turnover.status)}
            </Badge>
            {turnover.status !== "COMPLETED" ? (
              <form action={closeTurnoverAction}>
                <input type="hidden" name="turnoverId" value={turnover.id} />
                <Button type="submit">Close turnover</Button>
              </form>
            ) : null}
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Cleaner</p>
          <p className="mt-1 font-medium">
            {turnover.assignments[0]?.teamMember?.name ?? "Unassigned"}
          </p>
          <Link href="/assignments" className="text-xs text-[var(--accent)]">
            Manage assignments
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">SOP</p>
          <p className="mt-1 font-medium">{turnover.sop?.name ?? "Not loaded"}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">SOW</p>
          <p className="mt-1 font-medium">{turnover.sowTemplate?.name ?? "Not defined"}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Owner</p>
          <p className="mt-1 font-medium">{turnover.property.owner?.name ?? "—"}</p>
          {turnover.ownerNotifiedAt ? (
            <p className="text-xs text-emerald-700">Notified {formatDateTime(turnover.ownerNotifiedAt)}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Scope of work</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {scope.standardScope ?? turnover.sowTemplate?.standardScope ?? "Standard clean"}
            </p>
            {addOns.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {addOns.map((a) => (
                  <Badge key={a} tone="info">
                    {a}
                  </Badge>
                ))}
              </div>
            ) : null}
            {turnover.isDeepClean ? <Badge tone="warning">Deep-clean cadence</Badge> : null}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
              Checklist / SOP execution
            </h2>
            {sections.map((section) => (
              <div key={section} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  {section}
                </p>
                <div className="space-y-2">
                  {turnover.checklist
                    .filter((c) => c.section === section)
                    .map((item) => (
                      <form
                        key={item.id}
                        action={toggleChecklistItemAction}
                        className="flex items-start gap-3 rounded-xl border border-[var(--border)] px-3 py-2"
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className={`mt-0.5 h-5 w-5 shrink-0 rounded border ${
                            item.completed
                              ? "border-emerald-600 bg-emerald-600"
                              : "border-[var(--border)] bg-white"
                          }`}
                          aria-label="Toggle"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${item.completed ? "line-through opacity-60" : ""}`}>
                            {item.title}
                          </p>
                          {item.instructions ? (
                            <p className="text-xs text-[var(--muted)]">{item.instructions}</p>
                          ) : null}
                          {item.requiresPhoto ? (
                            <Badge tone="info">Photo required</Badge>
                          ) : null}
                        </div>
                      </form>
                    ))}
                </div>
              </div>
            ))}
            {turnover.checklist.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Approve the SOP Agent action to load the property playbook.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold">
              Photo proof
            </h2>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {turnover.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.label} className="h-36 w-full object-cover" />
                  <div className="p-2">
                    <p className="text-sm font-medium">{photo.label}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {photo.verified ? <Badge tone="success">Verified</Badge> : null}
                      {photo.rejected ? <Badge tone="danger">Rejected</Badge> : null}
                      {!photo.verified && !photo.rejected ? <Badge tone="warning">Pending</Badge> : null}
                      {photo.aiScore != null ? <Badge>AI {photo.aiScore}</Badge> : null}
                    </div>
                    {photo.aiNotes ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">{photo.aiNotes}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <form action={addPhotoAction} className="grid gap-2 sm:grid-cols-3">
              <input type="hidden" name="turnoverId" value={turnover.id} />
              <Input name="label" placeholder="Photo label" required />
              <Input name="url" placeholder="Image URL" required />
              <Button type="submit">Upload proof</Button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
              Report issue
            </h2>
            <form action={createIssueAction} className="space-y-2">
              <input type="hidden" name="turnoverId" value={turnover.id} />
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} required />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select id="severity" name="severity" defaultValue="MEDIUM">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="damage">
                  <option value="damage">Damage</option>
                  <option value="missing">Missing item</option>
                  <option value="miss">Clean miss</option>
                  <option value="access">Access</option>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Escalate issue
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              {turnover.issues.map((issue) => (
                <div key={issue.id} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                  <p className="font-medium">{issue.title}</p>
                  <Badge tone={issue.severity === "CRITICAL" || issue.severity === "HIGH" ? "danger" : "warning"}>
                    {issue.severity} · {statusLabel(issue.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
              Agent trail
            </h2>
            <div className="space-y-3">
              {turnover.agentActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                  <p className="text-xs font-semibold text-[var(--accent)]">
                    {agentLabel(action.agentType)}
                  </p>
                  <p className="text-sm font-medium">{action.title}</p>
                  <Badge
                    tone={
                      action.status === "EXECUTED"
                        ? "success"
                        : action.status === "PENDING_APPROVAL"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {statusLabel(action.status)}
                  </Badge>
                  {action.status === "PENDING_APPROVAL" ? (
                    <div className="mt-2 flex gap-2">
                      <form action={approveAgentAction}>
                        <input type="hidden" name="id" value={action.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button type="submit" size="sm">
                          Approve
                        </Button>
                      </form>
                      <form action={approveAgentAction}>
                        <input type="hidden" name="id" value={action.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <Button type="submit" size="sm" variant="outline">
                          Reject
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
