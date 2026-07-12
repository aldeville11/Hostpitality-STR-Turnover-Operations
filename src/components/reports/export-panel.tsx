"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, ModuleCard } from "@/components/ui";
import type { ReportView } from "@/lib/reports";

export function ExportPanel({
  view,
  filename,
  csv,
  summary,
}: {
  view: ReportView;
  filename: string;
  csv: string;
  summary?: string;
}) {
  const [copied, setCopied] = useState(false);
  const blobUrl = useMemo(() => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    return URL.createObjectURL(blob);
  }, [csv]);

  useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  function copyCsv() {
    void navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <ModuleCard
      title="Export"
      description={
        summary ??
        `Download the current ${view} report as CSV with active filters applied.`
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <a
            href={blobUrl}
            download={filename}
            className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            Download CSV
          </a>
          <Button type="button" variant="outline" onClick={copyCsv}>
            {copied ? "Copied" : "Copy CSV"}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-[var(--muted)]">
        File: <span className="font-medium text-[var(--text-secondary)]">{filename}</span>
      </p>
    </ModuleCard>
  );
}
