"use client";

import { Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import {
  SECTION_KIND_LABELS,
  SOP_SECTION_KINDS,
  SOP_STEP_KINDS,
  type SopSection,
  type SopSectionKind,
  type SopStep,
  type SopStepKind,
} from "@/lib/sops";

export function StepGroup({
  section,
  index,
  readOnly,
  onChange,
  onRemove,
  onMove,
}: {
  section: SopSection;
  index: number;
  readOnly?: boolean;
  onChange: (section: SopSection) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  function updateStep(stepId: string, patch: Partial<SopStep>) {
    onChange({
      ...section,
      steps: section.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  }

  function addStep() {
    const id = `step_${Math.random().toString(36).slice(2, 10)}`;
    onChange({
      ...section,
      steps: [
        ...section.steps,
        {
          id,
          title: "New step",
          instructions: "",
          requiresPhoto: false,
          kind: "task",
        },
      ],
    });
  }

  function removeStep(stepId: string) {
    onChange({
      ...section,
      steps: section.steps.filter((s) => s.id !== stepId),
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">Section {index + 1}</Badge>
          <Badge tone="neutral">{SECTION_KIND_LABELS[section.kind]}</Badge>
          {section.room ? <Badge tone="info">{section.room}</Badge> : null}
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => onMove(-1)}>
              Up
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onMove(1)}>
              Down
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={onRemove}>
              Remove
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Section title</Label>
          <Input
            value={section.title}
            disabled={readOnly}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
        </div>
        <div>
          <Label>Section type</Label>
          <Select
            value={section.kind}
            disabled={readOnly}
            onChange={(e) =>
              onChange({ ...section, kind: e.target.value as SopSectionKind })
            }
          >
            {SOP_SECTION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {SECTION_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        </div>
        {section.kind === "room" ? (
          <div>
            <Label>Room</Label>
            <Input
              value={section.room ?? ""}
              disabled={readOnly}
              placeholder="Kitchen, Bedroom 1…"
              onChange={(e) => onChange({ ...section, room: e.target.value })}
            />
          </div>
        ) : null}
        <div className={section.kind === "room" ? "" : "sm:col-span-2"}>
          <Label>Section notes</Label>
          <Input
            value={section.notes ?? ""}
            disabled={readOnly}
            placeholder="Optional guidance for this group"
            onChange={(e) => onChange({ ...section, notes: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Steps
        </p>
        {section.steps.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No steps in this section.</p>
        ) : (
          section.steps.map((step, stepIdx) => (
            <div
              key={step.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--muted)]">Step {stepIdx + 1}</p>
                {!readOnly ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeStep(step.id)}>
                    Remove step
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Task</Label>
                  <Input
                    value={step.title}
                    disabled={readOnly}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Instructions</Label>
                  <Textarea
                    rows={2}
                    value={step.instructions ?? ""}
                    disabled={readOnly}
                    onChange={(e) => updateStep(step.id, { instructions: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Step type</Label>
                  <Select
                    value={step.kind ?? "task"}
                    disabled={readOnly}
                    onChange={(e) =>
                      updateStep(step.id, { kind: e.target.value as SopStepKind })
                    }
                  >
                    {SOP_STEP_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(step.requiresPhoto)}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateStep(step.id, { requiresPhoto: e.target.checked })
                      }
                    />
                    Requires photo
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
        {!readOnly ? (
          <Button type="button" size="sm" variant="outline" onClick={addStep}>
            Add step
          </Button>
        ) : null}
      </div>
    </div>
  );
}
