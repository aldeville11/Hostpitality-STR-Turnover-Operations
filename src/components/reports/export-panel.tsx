"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
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
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Export
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {summary ??
              `Download the current ${view} report as CSV with active filters applied.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={blobUrl}
            download={filename}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--accent-strong)]"
          >
            Download CSV
          </a>
          <Button type="button" variant="outline" onClick={copyCsv}>
            {copied ? "Copied" : "Copy CSV"}
          </Button>
        </div>
      </div>
    </section>
  );
}
