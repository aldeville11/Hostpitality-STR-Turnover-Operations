"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { ScopeItemBuilder } from "@/components/sows/scope-item-builder";
import { AddonBuilder } from "@/components/sows/addon-builder";
import { ApprovalPanel } from "@/components/sows/approval-panel";
import { VersionHistory } from "@/components/sows/version-history";
import {
  archiveSowAction,
  duplicateSowAction,
  linkSowPropertiesAction,
  restoreSowDraftAction,
  saveSowAction,
} from "@/lib/sow-actions";
import {
  STATUS_LABELS,
  makeApprovalGate,
  makeEscalationRule,
  makePhotoRequirement,
  makeRestockItem,
  serializeSowDocument,
  type SowDocument,
  type SowStatus,
} from "@/lib/sows";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/properties";
import { formatDateTime } from "@/lib/utils";

type PropertyOption = {
  id: string;
  name: string;
  unitCode: string;
  unitType: string;
  sowId: string | null;
};

type Version = {
  id: string;
  version: number;
  name: string;
  status: string;
  changeNote: string | null;
  actorName: string | null;
  createdAt: Date | string;
};

type Sow = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  status: string;
  unitType: string | null;
  useCase: string | null;
  propertyGroup: string | null;
  slaMinutes: number;
  completionDeadlineMinutes: number;
  approvedAt: Date | string | null;
  approvedByName: string | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  properties: { id: string; name: string; unitCode: string }[];
};

export function SowEditor({
  sow,
  initialDocument,
  allProperties,
  versions,
  canManage,
}: {
  sow: Sow;
  initialDocument: SowDocument;
  allProperties: PropertyOption[];
  versions: Version[];
  canManage: boolean;
}) {
  const [name, setName] = useState(sow.name);
  const [description, setDescription] = useState(sow.description ?? "");
  const [unitType, setUnitType] = useState(sow.unitType ?? "");
  const [useCase, setUseCase] = useState(sow.useCase ?? "");
  const [propertyGroup, setPropertyGroup] = useState(sow.propertyGroup ?? "");
  const [slaMinutes, setSlaMinutes] = useState(String(sow.slaMinutes));
  const [completionDeadlineMinutes, setCompletionDeadlineMinutes] = useState(
    String(sow.completionDeadlineMinutes)
  );
  const [changeNote, setChangeNote] = useState("");
  const [document, setDocument] = useState<SowDocument>(initialDocument);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(
    sow.properties.map((p) => p.id)
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const readOnly = !canManage || sow.status === "ARCHIVED";
  const status = sow.status as SowStatus;

  function buildPayload(extra?: Record<string, string>) {
    const fd = new FormData();
    fd.set("sowId", sow.id);
    fd.set("name", name);
    fd.set("description", description);
    fd.set("unitType", unitType);
    fd.set("useCase", useCase);
    fd.set("propertyGroup", propertyGroup);
    fd.set("slaMinutes", slaMinutes);
    fd.set("completionDeadlineMinutes", completionDeadlineMinutes);
    fd.set("changeNote", changeNote);
    fd.set("documentJson", serializeSowDocument(document));
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    return fd;
  }

  function run(
    action: (fd: FormData) => Promise<{ error?: string; ok?: boolean } | void>,
    extra?: Record<string, string>,
    successMsg?: string
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await action(buildPayload(extra));
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
            status === "ACTIVE"
              ? "success"
              : status === "APPROVED"
                ? "accent"
                : status === "PENDING_REVIEW"
                  ? "info"
                  : status === "DRAFT"
                    ? "warning"
                    : "neutral"
          }
        >
          {STATUS_LABELS[status] ?? sow.status}
        </Badge>
        <Badge tone="accent">v{sow.version}</Badge>
        {status === "ACTIVE" ? <Badge tone="info">Default for linked properties</Badge> : null}
        <span className="text-xs text-[var(--muted)]">
          Updated {formatDateTime(sow.updatedAt)}
          {sow.publishedAt ? ` · Published ${formatDateTime(sow.publishedAt)}` : ""}
        </span>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Template details
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} />
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
            <Label htmlFor="useCase">Default use case</Label>
            <Input
              id="useCase"
              value={useCase}
              disabled={readOnly}
              placeholder="Standard turnover / Same-day rush"
              onChange={(e) => setUseCase(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="propertyGroup">Property group</Label>
            <Input
              id="propertyGroup"
              value={propertyGroup}
              disabled={readOnly}
              placeholder="Coastal units / Downtown set"
              onChange={(e) => setPropertyGroup(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="unitType">Unit type focus</Label>
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
              placeholder="What changed?"
              onChange={(e) => setChangeNote(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="slaMinutes">SLA (minutes)</Label>
            <Input
              id="slaMinutes"
              type="number"
              min={30}
              value={slaMinutes}
              disabled={readOnly}
              onChange={(e) => setSlaMinutes(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="completionDeadlineMinutes">Completion deadline (minutes)</Label>
            <Input
              id="completionDeadlineMinutes"
              type="number"
              min={30}
              value={completionDeadlineMinutes}
              disabled={readOnly}
              onChange={(e) => setCompletionDeadlineMinutes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <ScopeItemBuilder
        items={document.scopeItems}
        readOnly={readOnly}
        onChange={(scopeItems) => setDocument({ ...document, scopeItems })}
      />
      <AddonBuilder
        items={document.addOns}
        readOnly={readOnly}
        onChange={(addOns) => setDocument({ ...document, addOns })}
      />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Restock items
            </h2>
            <p className="text-sm text-[var(--muted)]">Par levels included in the turnover scope.</p>
          </div>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDocument({
                  ...document,
                  restockItems: [...document.restockItems, makeRestockItem()],
                })
              }
            >
              Add restock item
            </Button>
          ) : null}
        </div>
        {document.restockItems.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No restock items configured.</p>
        ) : (
          <div className="space-y-2">
            {document.restockItems.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-4">
                <Input
                  value={item.name}
                  disabled={readOnly}
                  placeholder="Item"
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      restockItems: document.restockItems.map((r) =>
                        r.id === item.id ? { ...r, name: e.target.value } : r
                      ),
                    })
                  }
                />
                <Input
                  type="number"
                  value={item.quantity}
                  disabled={readOnly}
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      restockItems: document.restockItems.map((r) =>
                        r.id === item.id ? { ...r, quantity: Number(e.target.value) || 0 } : r
                      ),
                    })
                  }
                />
                <Input
                  value={item.unit}
                  disabled={readOnly}
                  placeholder="unit"
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      restockItems: document.restockItems.map((r) =>
                        r.id === item.id ? { ...r, unit: e.target.value } : r
                      ),
                    })
                  }
                />
                {!readOnly ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDocument({
                        ...document,
                        restockItems: document.restockItems.filter((r) => r.id !== item.id),
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Photo proof requirements
            </h2>
            <p className="text-sm text-[var(--muted)]">Shots required before Ready for QA.</p>
          </div>
          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDocument({
                  ...document,
                  photoRequirements: [
                    ...document.photoRequirements,
                    makePhotoRequirement(),
                  ],
                })
              }
            >
              Add photo requirement
            </Button>
          ) : null}
        </div>
        <div className="space-y-2">
          {document.photoRequirements.map((item) => (
            <div key={item.id} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-4">
              <Input
                className="sm:col-span-2"
                value={item.label}
                disabled={readOnly}
                onChange={(e) =>
                  setDocument({
                    ...document,
                    photoRequirements: document.photoRequirements.map((p) =>
                      p.id === item.id ? { ...p, label: e.target.value } : p
                    ),
                  })
                }
              />
              <Input
                type="number"
                min={1}
                value={item.count}
                disabled={readOnly}
                onChange={(e) =>
                  setDocument({
                    ...document,
                    photoRequirements: document.photoRequirements.map((p) =>
                      p.id === item.id ? { ...p, count: Number(e.target.value) || 1 } : p
                    ),
                  })
                }
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={item.required}
                    disabled={readOnly}
                    onChange={(e) =>
                      setDocument({
                        ...document,
                        photoRequirements: document.photoRequirements.map((p) =>
                          p.id === item.id ? { ...p, required: e.target.checked } : p
                        ),
                      })
                    }
                  />
                  Required
                </label>
                {!readOnly ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setDocument({
                        ...document,
                        photoRequirements: document.photoRequirements.filter(
                          (p) => p.id !== item.id
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Escalation rules
            </h2>
            {!readOnly ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDocument({
                    ...document,
                    escalationRules: [...document.escalationRules, makeEscalationRule()],
                  })
                }
              >
                Add rule
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            {document.escalationRules.map((rule) => (
              <div key={rule.id} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                <Input
                  value={rule.trigger}
                  disabled={readOnly}
                  placeholder="Trigger"
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      escalationRules: document.escalationRules.map((r) =>
                        r.id === rule.id ? { ...r, trigger: e.target.value } : r
                      ),
                    })
                  }
                />
                <Input
                  value={rule.action}
                  disabled={readOnly}
                  placeholder="Action"
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      escalationRules: document.escalationRules.map((r) =>
                        r.id === rule.id ? { ...r, action: e.target.value } : r
                      ),
                    })
                  }
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={rule.minutesAfterDeadline}
                    disabled={readOnly}
                    onChange={(e) =>
                      setDocument({
                        ...document,
                        escalationRules: document.escalationRules.map((r) =>
                          r.id === rule.id
                            ? { ...r, minutesAfterDeadline: Number(e.target.value) || 0 }
                            : r
                        ),
                      })
                    }
                  />
                  <span className="text-xs text-[var(--muted)]">min after deadline</span>
                  {!readOnly ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDocument({
                          ...document,
                          escalationRules: document.escalationRules.filter(
                            (r) => r.id !== rule.id
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Approval gates
            </h2>
            {!readOnly ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDocument({
                    ...document,
                    approvalGates: [...document.approvalGates, makeApprovalGate()],
                  })
                }
              >
                Add gate
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            {document.approvalGates.map((gate) => (
              <div key={gate.id} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                <Input
                  value={gate.name}
                  disabled={readOnly}
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      approvalGates: document.approvalGates.map((g) =>
                        g.id === gate.id ? { ...g, name: e.target.value } : g
                      ),
                    })
                  }
                />
                <Textarea
                  rows={2}
                  value={gate.description ?? ""}
                  disabled={readOnly}
                  onChange={(e) =>
                    setDocument({
                      ...document,
                      approvalGates: document.approvalGates.map((g) =>
                        g.id === gate.id ? { ...g, description: e.target.value } : g
                      ),
                    })
                  }
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={gate.required}
                      disabled={readOnly}
                      onChange={(e) =>
                        setDocument({
                          ...document,
                          approvalGates: document.approvalGates.map((g) =>
                            g.id === gate.id ? { ...g, required: e.target.checked } : g
                          ),
                        })
                      }
                    />
                    Required gate
                  </label>
                  {!readOnly ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDocument({
                          ...document,
                          approvalGates: document.approvalGates.filter(
                            (g) => g.id !== gate.id
                          ),
                        })
                      }
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {canManage ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Save & lifecycle
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {sow.status !== "ARCHIVED" ? (
              <>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => run(saveSowAction, undefined, "Draft saved")}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(saveSowAction, { bumpVersion: "1" }, "New version saved")
                  }
                >
                  Save as new version
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pending}
                  onClick={() => run(archiveSowAction, undefined, "Archived")}
                >
                  Archive
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={pending}
                onClick={() => run(restoreSowDraftAction, undefined, "Restored to draft")}
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
                  fd.set("sowId", sow.id);
                  const res = await duplicateSowAction(fd);
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
        <ApprovalPanel
          sowId={sow.id}
          status={sow.status}
          approvedAt={sow.approvedAt}
          approvedByName={sow.approvedByName}
          canManage={canManage}
          buildPayload={() => buildPayload()}
        />

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Linked properties
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Attach this template to properties or a property group. Active templates become the
            default turnover scope.
          </p>
          {canManage && sow.status !== "ARCHIVED" ? (
            <form
              className="mt-4 space-y-3"
              action={(fd) => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const res = await linkSowPropertiesAction(fd);
                  if (res?.error) setError(res.error);
                  else {
                    setMessage("Property links updated");
                    router.refresh();
                  }
                });
              }}
            >
              <input type="hidden" name="sowId" value={sow.id} />
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] p-3">
                {allProperties.map((property) => (
                  <label key={property.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="propertyIds"
                      value={property.id}
                      checked={selectedPropertyIds.includes(property.id)}
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
                      {property.sowId && property.sowId !== sow.id ? (
                        <span className="text-[var(--muted)]">
                          {" "}
                          — linked to another template
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
              <Button type="submit" size="sm" disabled={pending}>
                Save property links
              </Button>
            </form>
          ) : (
            <div className="mt-3 flex flex-wrap gap-1">
              {sow.properties.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No properties linked.</p>
              ) : (
                sow.properties.map((p) => (
                  <Badge key={p.id} tone="info">
                    {p.name} ({p.unitCode})
                  </Badge>
                ))
              )}
            </div>
          )}
        </section>
      </div>

      <VersionHistory
        sowId={sow.id}
        currentVersion={sow.version}
        versions={versions}
        canManage={canManage && sow.status !== "ARCHIVED"}
      />
    </div>
  );
}
