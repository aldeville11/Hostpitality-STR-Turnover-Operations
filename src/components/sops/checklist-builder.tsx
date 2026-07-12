"use client";

import { Button } from "@/components/ui";
import { StepGroup } from "@/components/sops/step-group";
import {
  makeSection,
  type SopDocument,
  type SopSection,
  type SopSectionKind,
} from "@/lib/sops";

const QUICK_ADD: { label: string; kind: SopSectionKind; room?: string }[] = [
  { label: "Prep", kind: "prep" },
  { label: "Room group", kind: "room", room: "New room" },
  { label: "Checklist", kind: "checklist" },
  { label: "Deep clean", kind: "deep_clean" },
  { label: "Restock", kind: "restock" },
  { label: "Safety", kind: "safety" },
  { label: "Sign-off", kind: "signoff" },
];

export function ChecklistBuilder({
  document,
  readOnly,
  onChange,
}: {
  document: SopDocument;
  readOnly?: boolean;
  onChange: (doc: SopDocument) => void;
}) {
  function updateSection(id: string, next: SopSection) {
    onChange({
      ...document,
      sections: document.sections.map((s) => (s.id === id ? next : s)),
    });
  }

  function removeSection(id: string) {
    onChange({
      ...document,
      sections: document.sections.filter((s) => s.id !== id),
    });
  }

  function moveSection(id: string, dir: -1 | 1) {
    const idx = document.sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= document.sections.length) return;
    const sections = [...document.sections];
    const [item] = sections.splice(idx, 1);
    sections.splice(target, 0, item);
    onChange({ ...document, sections });
  }

  function addSection(kind: SopSectionKind, room?: string) {
    const titles: Record<SopSectionKind, string> = {
      prep: "Pre-turnover prep",
      room: "Room-by-room",
      checklist: "Checklist",
      deep_clean: "Deep clean",
      restock: "Restock",
      safety: "Safety notes",
      signoff: "Completion sign-off",
      custom: "Custom section",
    };
    onChange({
      ...document,
      sections: [
        ...document.sections,
        makeSection({
          title: titles[kind],
          kind,
          room,
          steps: [
            {
              id: `step_${Math.random().toString(36).slice(2, 10)}`,
              title: kind === "restock" ? "Restock item to par" : "New task",
              instructions: "",
              requiresPhoto: kind === "signoff" || kind === "room",
              kind:
                kind === "restock"
                  ? "restock"
                  : kind === "safety"
                    ? "safety"
                    : kind === "deep_clean"
                      ? "deep_clean"
                      : "task",
            },
          ],
        }),
      ],
    });
  }

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          {QUICK_ADD.map((item) => (
            <Button
              key={item.label}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addSection(item.kind, item.room)}
            >
              + {item.label}
            </Button>
          ))}
        </div>
      ) : null}

      {document.sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-base font-semibold">
            Empty playbook
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            Add room groups, restock instructions, deep-clean tasks, and safety notes to define
            how turnovers run.
          </p>
        </div>
      ) : (
        document.sections.map((section, index) => (
          <StepGroup
            key={section.id}
            section={section}
            index={index}
            readOnly={readOnly}
            onChange={(next) => updateSection(section.id, next)}
            onRemove={() => removeSection(section.id)}
            onMove={(dir) => moveSection(section.id, dir)}
          />
        ))
      )}
    </div>
  );
}
