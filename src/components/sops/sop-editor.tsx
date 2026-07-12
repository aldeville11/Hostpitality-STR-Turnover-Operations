"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { ChecklistBuilder } from "@/components/sops/checklist-builder";
import { VersionHistory } from "@/components/sops/version-history";
import {
  archiveSopAction,
  duplicateSopAction,
  linkSopPropertiesAction,
  publishSopAction,
  restoreSopDraftAction,
  saveSopAction,
} from "@/lib/sop-actions";
import {
  STATUS_LABELS,
  countSteps,
  serializeSopDocument,
  type SopDocument,
  type SopStatus,
} from "@/lib/sops";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";
import { formatDateTime } from "@/lib/utils";

type PropertyOption = {
  id: string;
  name: string;
  unitCode: string;
  unitType: string;
  sopId: string | null;
};

type Version = {
  id: string;
  version: number;
  name: string;
  changeNote: string | null;
  actorName: string | null;
  createdAt: Date | string;
};

type Sop = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  unitType: string | null;
  safetyNotes: string | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  properties: { id: string; name: string; unitCode: string }[];
};

export function SopEditor({
  sop,
  initialDocument,
  allProperties,
  versions,
  canManage,
}: {
  sop: Sop;
  initialDocument: SopDocument;
  allProperties: PropertyOption[];
  versions: Version[];
  canManage: boolean;
}) {
  const [name, setName] = useState(sop.name);
  const [description, setDescription] = useState(sop.description ?? "");
  const [unitType, setUnitType] = useState(sop.unitType ?? "");
  const [safetyNotes, setSafetyNotes] = useState(
    sop.safetyNotes ?? initialDocument.safetyNotes ?? ""
  );
  const [changeNote, setChangeNote] = useState("");
  const [document, setDocument] = useState<SopDocument>(initialDocument);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(
    sop.properties.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const readOnly = !canManage || sop.status === "ARCHIVED";
  const stepCount = useMemo(() => countSteps(document), [document]);
  const status = sop.status as SopStatus;

  function withPayload(extra?: Record<string, string>) {
    const fd = new FormData();
    fd.set("sopId", sop.id);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("unitType", unitType);
    fd.set("safetyNotes", safetyNotes);
    fd.set("changeNote", changeNote);
    fd.set(
      "documentJson",
      serializeSopDocument({ ...document, safetyNotes })
    );
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    return fd;
  }

  function run(action: (fd: FormData) => Promise<{ error?: string; ok?: boolean } | void>, extra?: Record<string, string>, successMsg?: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action(withPayload(extra));
      if (res && "error" in res && res.error) setError(res.error);
      else {
        setMessage(successMsg ?? "Saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          tone={
            status === "PUBLISHED" ? "success" : status === "DRAFT" ? "warning" : "neutral"
          }
        >
          {STATUS_LABELS[status] ?? sop.status}
        </Badge>
        <Badge tone="accent">v{sop.version}</Badge>
        {status === "PUBLISHED" ? <Badge tone="info">Active version</Badge> : null}
        <Badge tone="neutral">{stepCount} steps</Badge>
        <span className="text-xs text-[var(--muted)]">
          Updated {formatDateTime(sop.updatedAt)}
          {sop.publishedAt ? ` · Published ${formatDateTime(sop.publishedAt)}` : ""}
        </span>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          SOP details
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              disabled={readOnly}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unitType">Rental type focus</Label>
            <Select
              id="unitType"
              value={unitType}
              disabled={readOnly}
              onChange={(e) => setUnitType(e.target.value)}
            >
              <option value="">Any / general</option>
              {UNIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {unitTypeLabel(t)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="changeNote">Change note</Label>
            <Input
              id="changeNote"
              value={changeNote}
              disabled={readOnly}
              placeholder="What changed in this edit?"
              onChange={(e) => setChangeNote(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="safetyNotes">Safety notes</Label>
            <Textarea
              id="safetyNotes"
              rows={3}
              value={safetyNotes}
              disabled={readOnly}
              placeholder="Chemical rules, lockup, detectors…"
              onChange={(e) => setSafetyNotes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Structured playbook
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Room-by-room groups, checklists, deep-clean tasks, restock instructions, and safety
            steps. This content feeds turnover checklists.
          </p>
        </div>
        <ChecklistBuilder
          document={document}
          readOnly={readOnly}
          onChange={setDocument}
        />
      </section>

      {canManage ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Actions
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {sop.status !== "ARCHIVED" ? (
              <>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => run(saveSopAction, undefined, "Draft saved")}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(saveSopAction, { bumpVersion: "1" }, "New version saved")
                  }
                >
                  Save as new version
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => run(publishSopAction, undefined, "Published")}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(archiveSopAction, undefined, "Archived")}
                >
                  Archive
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={pending}
                onClick={() => run(restoreSopDraftAction, undefined, "Restored to draft")}
              >
                Restore to draft
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("sopId", sop.id);
                  const res = await duplicateSopAction(fd);
                  if (res?.error) setError(res.error);
                });
              }}
            >
              Duplicate
            </Button>
          </div>
          {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Linked properties
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Attach this SOP to one or more properties. Turnovers use the property&apos;s linked SOP
            for checklist generation.
          </p>
          {canManage && sop.status !== "ARCHIVED" ? (
            <form
              className="mt-4 space-y-3"
              action={(fd) => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const res = await linkSopPropertiesAction(fd);
                  if (res?.error) setError(res.error);
                  else {
                    setMessage("Property links updated");
                    router.refresh();
                  }
                });
              }}
            >
              <input type="hidden" name="sopId" value={sop.id} />
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] p-3">
                {allProperties.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">No active properties.</p>
                ) : (
                  allProperties.map((property) => {
                    const checked = selectedPropertyIds.includes(property.id);
                    const otherLink =
                      property.sopId && property.sopId !== sop.id
                        ? " (currently linked to another SOP)"
                        : "";
                    return (
                      <label key={property.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="propertyIds"
                          value={property.id}
                          checked={checked}
                          onChange={(e) => {
                            setSelectedPropertyIds((prev) =>
                              e.target.checked
                                ? [...prev, property.id]
                                : prev.filter((id) => id !== property.id)
                            );
                          }}
                        />
                        <span>
                          {property.name} ({property.unitCode})
                          <span className="text-[var(--muted)]">{otherLink}</span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <Button type="submit" size="sm" disabled={pending}>
                Save property links
              </Button>
            </form>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1">
              {sop.properties.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No properties linked.</p>
              ) : (
                sop.properties.map((p) => (
                  <Badge key={p.id} tone="info">
                    {p.name} ({p.unitCode})
                  </Badge>
                ))
              )}
            </div>
          )}
        </section>

        <VersionHistory
          sopId={sop.id}
          currentVersion={sop.version}
          versions={versions}
          canManage={canManage && sop.status !== "ARCHIVED"}
        />
      </div>
    </div>
  );
}
