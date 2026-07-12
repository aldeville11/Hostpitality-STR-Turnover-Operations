import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { approveAgentAction, runPhotoVerificationAction } from "@/lib/actions";
import { formatDateTime, statusLabel } from "@/lib/utils";

export default async function QaPage() {
  const user = await requireUser({ permission: "qa:review" });
  if (!user.companyId) redirect("/onboarding");

  const turnovers = await prisma.turnover.findMany({
    where: {
      companyId: user.companyId,
      status: { in: ["IN_PROGRESS", "QA_PENDING", "ASSIGNED", "ISSUES_OPEN"] },
    },
    include: {
      property: true,
      checklist: true,
      photos: true,
      agentActions: {
        where: { agentType: { in: ["PHOTO_VERIFICATION", "CHECKLIST_QA"] }, status: "PENDING_APPROVAL" },
      },
    },
    orderBy: { deadlineAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="QA / Photo Review"
        description="Verify checklist completion and photo proofs before guest arrival."
      />

      {turnovers.length === 0 ? (
        <EmptyState title="Nothing in QA" description="Active turnovers needing review will appear here." />
      ) : (
        <div className="space-y-4">
          {turnovers.map((t) => {
            const done = t.checklist.filter((c) => c.completed).length;
            const requiredPhotos = t.checklist.filter((c) => c.requiresPhoto).length;
            const verified = t.photos.filter((p) => p.verified).length;
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/turnovers/${t.id}`}
                      className="font-[family-name:var(--font-display)] text-lg font-semibold hover:text-[var(--accent)]"
                    >
                      {t.property.name}
                    </Link>
                    <p className="text-sm text-[var(--muted)]">
                      Due {formatDateTime(t.deadlineAt)} · Checklist {done}/{t.checklist.length} · Photos{" "}
                      {verified}/{Math.max(requiredPhotos, t.photos.length)}
                    </p>
                  </div>
                  <Badge tone="accent">{statusLabel(t.status)}</Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {t.photos.map((photo) => (
                    <div key={photo.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.label} className="h-32 w-full object-cover" />
                      <div className="p-2 text-sm">
                        <p className="font-medium">{photo.label}</p>
                        {photo.verified ? (
                          <Badge tone="success">Verified · {photo.aiScore}</Badge>
                        ) : photo.rejected ? (
                          <Badge tone="danger">Rejected</Badge>
                        ) : (
                          <Badge tone="warning">Needs verification</Badge>
                        )}
                        {photo.aiNotes ? (
                          <p className="mt-1 text-xs text-[var(--muted)]">{photo.aiNotes}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={runPhotoVerificationAction}>
                    <input type="hidden" name="turnoverId" value={t.id} />
                    <Button type="submit" variant="outline" size="sm">
                      Queue photo verification agent
                    </Button>
                  </form>
                  {t.agentActions.map((action) => (
                    <form key={action.id} action={approveAgentAction}>
                      <input type="hidden" name="id" value={action.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <Button type="submit" size="sm">
                        Approve: {action.title}
                      </Button>
                    </form>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
