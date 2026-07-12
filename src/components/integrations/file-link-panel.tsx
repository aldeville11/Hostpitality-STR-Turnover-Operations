"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { attachFileAction } from "@/lib/integration-actions";
import { formatSyncTime } from "@/lib/integrations";
import { Badge, Button, Input } from "@/components/ui";

type FileRow = {
  id: string;
  filename: string;
  label: string | null;
  entityType: string;
  entityId: string;
  source: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date | string;
};

export function FileLinkPanel({
  files,
  canManage,
  defaultEntityType = "Issue",
  defaultEntityId = "",
}: {
  files: FileRow[];
  canManage: boolean;
  defaultEntityType?: string;
  defaultEntityId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [entityType, setEntityType] = useState(defaultEntityType);
  const [entityId, setEntityId] = useState(defaultEntityId);
  const [filename, setFilename] = useState("");
  const [label, setLabel] = useState("");

  function attach() {
    setError(null);
    const fd = new FormData();
    fd.set("entityType", entityType);
    fd.set("entityId", entityId);
    fd.set("filename", filename);
    fd.set("label", label);
    startTransition(async () => {
      const res = await attachFileAction(fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setFilename("");
      setLabel("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Linked files
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        QA photos, issue photos, and operational documents referenced in storage.
      </p>

      {files.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">No files linked yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{file.label ?? file.filename}</p>
                <p className="text-xs text-[var(--muted)]">
                  {file.entityType} · {file.source} · {formatSyncTime(file.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{file.mimeType}</Badge>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
          <p className="text-sm font-medium">Attach file reference</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              placeholder="Entity type (Issue, QaInspection, Turnover)"
              disabled={pending}
            />
            <Input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Entity ID"
              disabled={pending}
            />
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename.jpg"
              disabled={pending}
            />
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              disabled={pending}
            />
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <Button type="button" onClick={attach} disabled={pending || !filename || !entityId}>
            {pending ? "Saving…" : "Attach reference"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
