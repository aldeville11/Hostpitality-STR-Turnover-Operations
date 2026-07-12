"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DetailSection, EmptyState, Textarea } from "@/components/ui";
import { reviewQaItemAction } from "@/lib/qa-actions";

type Item = {
  id: string;
  section: string;
  title: string;
  result: string;
  comment: string | null;
  checklistItemId: string | null;
};

export function InspectionChecklist({
  turnoverId,
  items,
  readOnly,
}: {
  turnoverId: string;
  items: Item[];
  readOnly?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<Record<string, string>>({});
  const router = useRouter();

  const sections = Array.from(new Set(items.map((i) => i.section)));

  function review(itemId: string, result: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("itemId", itemId);
      fd.set("result", result);
      fd.set("turnoverId", turnoverId);
      fd.set("comment", comments[itemId] ?? "");
      const res = await reviewQaItemAction(fd);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <DetailSection
      title="Inspection checklist"
      description="Mark each SOP-derived task pass or fail. Failed items require a comment."
    >
      {items.length === 0 ? (
        <EmptyState
          title="No checklist items"
          description="No checklist items on this turnover."
        />
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                {section}
              </p>
              <div className="space-y-2">
                {items
                  .filter((i) => i.section === section)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[var(--border)] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.comment ? (
                            <p className="mt-1 text-xs text-[var(--muted)]">{item.comment}</p>
                          ) : null}
                        </div>
                        <Badge
                          tone={
                            item.result === "PASS"
                              ? "success"
                              : item.result === "FAIL"
                                ? "danger"
                                : item.result === "NA"
                                  ? "neutral"
                                  : "warning"
                          }
                        >
                          {item.result}
                        </Badge>
                      </div>
                      {!readOnly ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Comment (required on fail)"
                            value={comments[item.id] ?? item.comment ?? ""}
                            onChange={(e) =>
                              setComments((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={pending}
                              onClick={() => review(item.id, "PASS")}
                            >
                              Pass
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              disabled={pending}
                              onClick={() => review(item.id, "FAIL")}
                            >
                              Fail
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => review(item.id, "NA")}
                            >
                              N/A
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </DetailSection>
  );
}
