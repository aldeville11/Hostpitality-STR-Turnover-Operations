"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DetailSection, EmptyState } from "@/components/ui";
import {
  regenerateChecklistAction,
  toggleChecklistItemAction,
} from "@/lib/turnover-actions";

type ChecklistItem = {
  id: string;
  section: string;
  title: string;
  instructions: string | null;
  requiresPhoto: boolean;
  completed: boolean;
  completedBy: string | null;
};

export function ChecklistPanel({
  turnoverId,
  items,
}: {
  turnoverId: string;
  items: ChecklistItem[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const sections = Array.from(new Set(items.map((i) => i.section)));
  const done = items.filter((i) => i.completed).length;

  return (
    <DetailSection
      title="Checklist"
      description={`Generated from the property SOP · ${done}/${items.length} complete`}
      actions={
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const res = await regenerateChecklistAction(fd);
              if (res?.error) setError(res.error);
              else router.refresh();
            });
          }}
        >
          <input type="hidden" name="id" value={turnoverId} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            Regenerate from SOP
          </Button>
        </form>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          title="No checklist items"
          description="Regenerate from the linked SOP to create tasks."
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
                    <form
                      key={item.id}
                      action={(fd) => {
                        setError(null);
                        startTransition(async () => {
                          const res = await toggleChecklistItemAction(fd);
                          if (res?.error) setError(res.error);
                          else router.refresh();
                        });
                      }}
                      className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        className={`mt-0.5 h-5 w-5 shrink-0 rounded border ${
                          item.completed
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-[var(--border)] bg-white"
                        }`}
                        aria-label="Toggle checklist item"
                        disabled={pending}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium text-[var(--text-primary)] ${
                            item.completed ? "line-through opacity-60" : ""
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.instructions ? (
                          <p className="text-xs text-[var(--text-secondary)]">{item.instructions}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.requiresPhoto ? <Badge tone="info">Photo</Badge> : null}
                          {item.completedBy ? (
                            <Badge tone="success">By {item.completedBy}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </form>
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
