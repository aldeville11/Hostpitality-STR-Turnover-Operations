"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createIssueAction } from "@/lib/issue-actions";
import {
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_LABELS,
  ISSUE_SEVERITIES,
  ISSUE_SEVERITY_LABELS,
  ISSUE_SOURCES,
  ISSUE_SOURCE_LABELS,
} from "@/lib/issues";
import { Button, Input, Select, Textarea } from "@/components/ui";

type Option = { id: string; label: string };

export function IssueForm({
  properties,
  turnovers,
  vendors,
  defaultPropertyId,
  defaultTurnoverId,
  defaultSource = "MANUAL",
}: {
  properties: Option[];
  turnovers: Option[];
  vendors: Option[];
  defaultPropertyId?: string;
  defaultTurnoverId?: string;
  defaultSource?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("redirectTo", "stay");
    startTransition(async () => {
      const result = await createIssueAction(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (result && "issueId" in result && result.issueId) {
        router.push(`/issues/${result.issueId}`);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        Create issue
      </Button>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
        Create issue
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Log a problem from QA, a blocked turnover, or manual entry.
      </p>

      <form action={onSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Source</label>
            <Select name="source" defaultValue={defaultSource} required>
              {ISSUE_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_SOURCE_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Severity</label>
            <Select name="severity" defaultValue="MEDIUM" required>
              {ISSUE_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {ISSUE_SEVERITY_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <Select name="category" defaultValue="damage" required>
              {ISSUE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ISSUE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Title</label>
          <Input name="title" required placeholder="Short description of the problem" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Description</label>
          <Textarea
            name="description"
            rows={3}
            required
            placeholder="What happened, where, and what needs fixing"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Property</label>
            <Select name="propertyId" defaultValue={defaultPropertyId ?? ""}>
              <option value="">None</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Turnover</label>
            <Select name="turnoverId" defaultValue={defaultTurnoverId ?? ""}>
              <option value="">None</option>
              {turnovers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Assignee (vendor)</label>
            <Select name="assigneeVendorId" defaultValue="">
              <option value="">Unassigned</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="blocking"
                value="1"
                className="rounded border-[var(--border)]"
              />
              Blocks active turnover
            </label>
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create issue"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
