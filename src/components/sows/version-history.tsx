"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";
import { restoreSowVersionAction } from "@/lib/sow-actions";
import { formatDateTime } from "@/lib/utils";

type Version = {
  id: string;
  version: number;
  name: string;
  status: string;
  changeNote: string | null;
  actorName: string | null;
  createdAt: Date | string;
};

export function VersionHistory({
  sowId,
  currentVersion,
  versions,
  canManage,
}: {
  sowId: string;
  currentVersion: number;
  versions: Version[];
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Version history
        </h2>
        <Badge tone="accent">v{currentVersion} current</Badge>
      </div>

      {versions.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No versions recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {versions.map((version) => (
            <li
              key={version.id}
              className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={version.version === currentVersion ? "success" : "neutral"}>
                    v{version.version}
                  </Badge>
                  <Badge tone="info">{version.status}</Badge>
                  <span className="font-medium">{version.name}</span>
                </div>
                {canManage && version.version !== currentVersion ? (
                  <form
                    action={(fd) => {
                      setError(null);
                      startTransition(async () => {
                        const res = await restoreSowVersionAction(fd);
                        if (res?.error) setError(res.error);
                        else router.refresh();
                      });
                    }}
                  >
                    <input type="hidden" name="sowId" value={sowId} />
                    <input type="hidden" name="versionId" value={version.id} />
                    <Button type="submit" size="sm" variant="outline" disabled={pending}>
                      Restore
                    </Button>
                  </form>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {formatDateTime(version.createdAt)}
                {version.actorName ? ` · ${version.actorName}` : ""}
              </p>
              {version.changeNote ? (
                <p className="mt-1 text-xs text-[var(--muted)]">{version.changeNote}</p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  );
}
