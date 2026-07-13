import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";
import {
  assertPropertyIdsAuthorizedForLink,
  propertyLinkMutationScopeWhere,
  type AccessScope,
} from "./access-scope";

export const SOW_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "ACTIVE",
  "ARCHIVED",
] as const;
export type SowStatus = (typeof SOW_STATUSES)[number];

export const STATUS_LABELS: Record<SowStatus, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  APPROVED: "Approved",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export type SowScopeItem = {
  id: string;
  title: string;
  description?: string;
  required: boolean;
};

export type SowAddOn = {
  id: string;
  name: string;
  description?: string;
  priceNote?: string;
  requiresApproval: boolean;
};

export type SowRestockItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export type SowPhotoRequirement = {
  id: string;
  label: string;
  required: boolean;
  count: number;
};

export type SowEscalationRule = {
  id: string;
  trigger: string;
  action: string;
  minutesAfterDeadline: number;
};

export type SowApprovalGate = {
  id: string;
  name: string;
  description?: string;
  required: boolean;
};

export type SowDocument = {
  version: 1;
  scopeItems: SowScopeItem[];
  addOns: SowAddOn[];
  restockItems: SowRestockItem[];
  photoRequirements: SowPhotoRequirement[];
  escalationRules: SowEscalationRule[];
  approvalGates: SowApprovalGate[];
};

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyDocument(): SowDocument {
  return {
    version: 1,
    scopeItems: [],
    addOns: [],
    restockItems: [],
    photoRequirements: [],
    escalationRules: [],
    approvalGates: [],
  };
}

export function makeScopeItem(partial?: Partial<SowScopeItem>): SowScopeItem {
  return {
    id: partial?.id ?? newId("scope"),
    title: partial?.title ?? "New scope item",
    description: partial?.description ?? "",
    required: partial?.required ?? true,
  };
}

export function makeAddOn(partial?: Partial<SowAddOn>): SowAddOn {
  return {
    id: partial?.id ?? newId("addon"),
    name: partial?.name ?? "New add-on",
    description: partial?.description ?? "",
    priceNote: partial?.priceNote ?? "",
    requiresApproval: partial?.requiresApproval ?? false,
  };
}

export function makeRestockItem(partial?: Partial<SowRestockItem>): SowRestockItem {
  return {
    id: partial?.id ?? newId("restock"),
    name: partial?.name ?? "Supply item",
    quantity: partial?.quantity ?? 1,
    unit: partial?.unit ?? "each",
  };
}

export function makePhotoRequirement(
  partial?: Partial<SowPhotoRequirement>
): SowPhotoRequirement {
  return {
    id: partial?.id ?? newId("photo"),
    label: partial?.label ?? "Photo proof",
    required: partial?.required ?? true,
    count: partial?.count ?? 1,
  };
}

export function makeEscalationRule(
  partial?: Partial<SowEscalationRule>
): SowEscalationRule {
  return {
    id: partial?.id ?? newId("esc"),
    trigger: partial?.trigger ?? "Past SLA deadline",
    action: partial?.action ?? "Notify coordinator and mark overdue",
    minutesAfterDeadline: partial?.minutesAfterDeadline ?? 30,
  };
}

export function makeApprovalGate(partial?: Partial<SowApprovalGate>): SowApprovalGate {
  return {
    id: partial?.id ?? newId("gate"),
    name: partial?.name ?? "Manager approval",
    description: partial?.description ?? "",
    required: partial?.required ?? true,
  };
}

/** Parse structured document; migrate legacy addOnsJson + standardScope when needed. */
export function parseSowDocument(
  contentJson: string | null | undefined,
  legacy?: { standardScope?: string; addOnsJson?: string }
): SowDocument {
  const parsed = parseJson<unknown>(contentJson, null);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && "scopeItems" in parsed) {
    const doc = parsed as SowDocument;
    return {
      version: 1,
      scopeItems: Array.isArray(doc.scopeItems)
        ? doc.scopeItems.map((i) => makeScopeItem(i))
        : [],
      addOns: Array.isArray(doc.addOns) ? doc.addOns.map((a) => makeAddOn(a)) : [],
      restockItems: Array.isArray(doc.restockItems)
        ? doc.restockItems.map((r) => makeRestockItem(r))
        : [],
      photoRequirements: Array.isArray(doc.photoRequirements)
        ? doc.photoRequirements.map((p) => makePhotoRequirement(p))
        : [],
      escalationRules: Array.isArray(doc.escalationRules)
        ? doc.escalationRules.map((e) => makeEscalationRule(e))
        : [],
      approvalGates: Array.isArray(doc.approvalGates)
        ? doc.approvalGates.map((g) => makeApprovalGate(g))
        : [],
    };
  }

  // Legacy fallback
  const doc = emptyDocument();
  const scopeLines = (legacy?.standardScope || "")
    .split(/[.,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  doc.scopeItems = scopeLines.length
    ? scopeLines.map((title) => makeScopeItem({ title, required: true }))
    : [
        makeScopeItem({ title: "Full unit clean" }),
        makeScopeItem({ title: "Linen change" }),
        makeScopeItem({ title: "Restock consumables" }),
        makeScopeItem({ title: "Photo proof set" }),
      ];
  const legacyAddOns = parseJson<string[]>(legacy?.addOnsJson, []);
  doc.addOns = legacyAddOns.map((name) => makeAddOn({ name }));
  doc.photoRequirements = [
    makePhotoRequirement({ label: "Kitchen after clean" }),
    makePhotoRequirement({ label: "Bathroom after clean" }),
    makePhotoRequirement({ label: "Bedroom staged" }),
    makePhotoRequirement({ label: "Final living room" }),
  ];
  doc.restockItems = [
    makeRestockItem({ name: "Toilet paper", quantity: 4, unit: "rolls" }),
    makeRestockItem({ name: "Paper towels", quantity: 2, unit: "rolls" }),
  ];
  doc.escalationRules = [
    makeEscalationRule({
      trigger: "Past SLA deadline",
      action: "Notify ops and escalate to coordinator",
      minutesAfterDeadline: 30,
    }),
  ];
  doc.approvalGates = [
    makeApprovalGate({
      name: "Rush / same-day add-on",
      description: "Coordinator approval required before rush billing",
      required: true,
    }),
  ];
  return doc;
}

export function serializeSowDocument(doc: SowDocument) {
  return JSON.stringify({
    version: 1,
    scopeItems: doc.scopeItems,
    addOns: doc.addOns,
    restockItems: doc.restockItems,
    photoRequirements: doc.photoRequirements,
    escalationRules: doc.escalationRules,
    approvalGates: doc.approvalGates,
  });
}

export function scopeSummaryFromDocument(doc: SowDocument) {
  const titles = doc.scopeItems.map((i) => i.title.trim()).filter(Boolean);
  return titles.length ? `${titles.join(", ")}.` : "";
}

export function addOnsJsonFromDocument(doc: SowDocument) {
  return JSON.stringify(doc.addOns.map((a) => a.name).filter(Boolean));
}

export function starterDocument(): SowDocument {
  return {
    version: 1,
    scopeItems: [
      makeScopeItem({ title: "Full clean of all living areas", required: true }),
      makeScopeItem({ title: "Linen change and bed make", required: true }),
      makeScopeItem({ title: "Bathroom sanitize", required: true }),
      makeScopeItem({ title: "Kitchen wipe and appliance check", required: true }),
      makeScopeItem({ title: "Trash removal", required: true }),
    ],
    addOns: [
      makeAddOn({
        name: "Pet hair treatment",
        description: "Extra vacuum and lint pass",
        priceNote: "+$45",
        requiresApproval: false,
      }),
      makeAddOn({
        name: "Rush turnover",
        description: "Same-day under 3 hours",
        priceNote: "+$75",
        requiresApproval: true,
      }),
    ],
    restockItems: [
      makeRestockItem({ name: "Toilet paper", quantity: 4, unit: "rolls" }),
      makeRestockItem({ name: "Paper towels", quantity: 2, unit: "rolls" }),
      makeRestockItem({ name: "Dishwasher pods", quantity: 4, unit: "pods" }),
      makeRestockItem({ name: "Trash bags", quantity: 1, unit: "box" }),
    ],
    photoRequirements: [
      makePhotoRequirement({ label: "Kitchen after clean", required: true, count: 1 }),
      makePhotoRequirement({ label: "Bathroom after clean", required: true, count: 1 }),
      makePhotoRequirement({ label: "Bedroom staged", required: true, count: 1 }),
      makePhotoRequirement({ label: "Final living room", required: true, count: 1 }),
    ],
    escalationRules: [
      makeEscalationRule({
        trigger: "Past completion deadline",
        action: "Notify cleaning coordinator",
        minutesAfterDeadline: 15,
      }),
      makeEscalationRule({
        trigger: "Blocked by access / damage",
        action: "Open issue and pause SLA clock",
        minutesAfterDeadline: 0,
      }),
    ],
    approvalGates: [
      makeApprovalGate({
        name: "Paid add-ons over $50",
        description: "Ops manager must approve before assignment",
        required: true,
      }),
      makeApprovalGate({
        name: "Deep-clean upgrade",
        description: "Confirm billable deep-clean with owner/ops",
        required: false,
      }),
    ],
  };
}

export async function listSows(
  companyId: string,
  filters?: { status?: string; propertyId?: string; unitType?: string; q?: string }
) {
  const sows = await prisma.sow.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.unitType ? { unitType: filters.unitType } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q } },
              { description: { contains: filters.q } },
              { useCase: { contains: filters.q } },
              { propertyGroup: { contains: filters.q } },
              { unitType: { contains: filters.q } },
            ],
          }
        : {}),
      ...(filters?.propertyId
        ? { properties: { some: { id: filters.propertyId } } }
        : {}),
    },
    include: {
      properties: {
        select: { id: true, name: true, unitCode: true, unitType: true },
        orderBy: { name: "asc" },
      },
      _count: { select: { versions: true, turnovers: true } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  const statusRank: Record<string, number> = {
    ACTIVE: 0,
    APPROVED: 1,
    PENDING_REVIEW: 2,
    DRAFT: 3,
    ARCHIVED: 4,
  };

  return [...sows]
    .sort((a, b) => {
      const byStatus = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .map((sow) => {
      const doc = parseSowDocument(sow.contentJson, {
        standardScope: sow.standardScope,
        addOnsJson: sow.addOnsJson,
      });
      return {
        ...sow,
        scopeCount: doc.scopeItems.length,
        addOnCount: doc.addOns.length,
        isActiveTemplate: sow.status === "ACTIVE",
      };
    });
}

export async function getSowDetail(companyId: string, sowId: string) {
  const sow = await prisma.sow.findFirst({
    where: { id: sowId, companyId },
    include: {
      properties: {
        select: { id: true, name: true, unitCode: true, unitType: true, active: true },
        orderBy: { name: "asc" },
      },
      versions: { orderBy: { version: "desc" } },
      _count: { select: { turnovers: true } },
    },
  });
  if (!sow) return null;

  const allProperties = await prisma.property.findMany({
    where: { companyId, active: true },
    select: { id: true, name: true, unitCode: true, unitType: true, sowId: true },
    orderBy: { name: "asc" },
  });

  const document = parseSowDocument(sow.contentJson, {
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
  });

  return { sow, document, allProperties };
}

async function snapshotVersion(input: {
  sowId: string;
  version: number;
  name: string;
  description: string | null;
  standardScope: string;
  addOnsJson: string;
  contentJson: string;
  slaMinutes: number;
  completionDeadlineMinutes: number;
  useCase: string | null;
  unitType: string | null;
  propertyGroup: string | null;
  status: string;
  changeNote?: string;
  actorId?: string;
  actorName?: string;
}) {
  const existing = await prisma.sowVersion.findUnique({
    where: { sowId_version: { sowId: input.sowId, version: input.version } },
  });
  if (existing) {
    return prisma.sowVersion.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        standardScope: input.standardScope,
        addOnsJson: input.addOnsJson,
        contentJson: input.contentJson,
        slaMinutes: input.slaMinutes,
        completionDeadlineMinutes: input.completionDeadlineMinutes,
        useCase: input.useCase,
        unitType: input.unitType,
        propertyGroup: input.propertyGroup,
        status: input.status,
        changeNote: input.changeNote ?? existing.changeNote,
        actorId: input.actorId ?? existing.actorId,
        actorName: input.actorName ?? existing.actorName,
      },
    });
  }
  return prisma.sowVersion.create({
    data: {
      sowId: input.sowId,
      version: input.version,
      name: input.name,
      description: input.description,
      standardScope: input.standardScope,
      addOnsJson: input.addOnsJson,
      contentJson: input.contentJson,
      slaMinutes: input.slaMinutes,
      completionDeadlineMinutes: input.completionDeadlineMinutes,
      useCase: input.useCase,
      unitType: input.unitType,
      propertyGroup: input.propertyGroup,
      status: input.status,
      changeNote: input.changeNote,
      actorId: input.actorId,
      actorName: input.actorName,
    },
  });
}

export async function createBlankSow(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  name: string;
  description?: string;
  unitType?: string;
  useCase?: string;
  propertyGroup?: string;
}) {
  const document = starterDocument();
  const contentJson = serializeSowDocument(document);
  const standardScope = scopeSummaryFromDocument(document);
  const addOnsJson = addOnsJsonFromDocument(document);

  const sow = await prisma.sow.create({
    data: {
      companyId: input.companyId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      standardScope,
      addOnsJson,
      contentJson,
      slaMinutes: 240,
      completionDeadlineMinutes: 240,
      version: 1,
      status: "DRAFT",
      unitType: input.unitType || null,
      useCase: input.useCase?.trim() || "Standard turnover",
      propertyGroup: input.propertyGroup?.trim() || null,
      active: false,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: 1,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: sow.status,
    changeNote: "Initial draft",
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.created",
    entityType: "Sow",
    entityId: sow.id,
  });

  return sow;
}

export async function duplicateSow(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
}) {
  const source = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!source) throw new Error("SOW template not found");

  const sow = await prisma.sow.create({
    data: {
      companyId: input.companyId,
      name: `${source.name} (copy)`,
      description: source.description,
      standardScope: source.standardScope,
      addOnsJson: source.addOnsJson,
      contentJson: source.contentJson,
      slaMinutes: source.slaMinutes,
      completionDeadlineMinutes: source.completionDeadlineMinutes,
      version: 1,
      status: "DRAFT",
      unitType: source.unitType,
      useCase: source.useCase,
      propertyGroup: source.propertyGroup,
      active: false,
      approvedAt: null,
      approvedById: null,
      approvedByName: null,
      publishedAt: null,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: 1,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: "DRAFT",
    changeNote: `Duplicated from ${source.name}`,
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.duplicated",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { sourceId: source.id },
  });

  return sow;
}

export async function saveSowContent(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
  name: string;
  description?: string;
  unitType?: string;
  useCase?: string;
  propertyGroup?: string;
  slaMinutes: number;
  completionDeadlineMinutes: number;
  document: SowDocument;
  bumpVersion?: boolean;
  changeNote?: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");
  if (existing.status === "ARCHIVED") {
    throw new Error("Archived templates cannot be edited. Duplicate instead.");
  }

  const contentJson = serializeSowDocument(input.document);
  const standardScope =
    scopeSummaryFromDocument(input.document) || existing.standardScope;
  const addOnsJson = addOnsJsonFromDocument(input.document);
  const nextVersion = input.bumpVersion ? existing.version + 1 : existing.version;
  const editingLive = existing.status === "ACTIVE" || existing.status === "APPROVED";

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unitType: input.unitType || null,
      useCase: input.useCase?.trim() || null,
      propertyGroup: input.propertyGroup?.trim() || null,
      slaMinutes: input.slaMinutes,
      completionDeadlineMinutes: input.completionDeadlineMinutes,
      contentJson,
      standardScope,
      addOnsJson,
      version: nextVersion,
      status: editingLive ? "DRAFT" : existing.status === "PENDING_REVIEW" ? "DRAFT" : existing.status,
      active: false,
      publishedAt: editingLive ? null : existing.publishedAt,
      approvedAt: editingLive ? null : existing.approvedAt,
      approvedById: editingLive ? null : existing.approvedById,
      approvedByName: editingLive ? null : existing.approvedByName,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: nextVersion,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: sow.status,
    changeNote: input.changeNote || (input.bumpVersion ? "New version" : "Draft saved"),
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.updated",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { version: sow.version, status: sow.status },
  });

  return sow;
}

export async function submitSowForReview(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
  changeNote?: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");
  if (!["DRAFT", "APPROVED"].includes(existing.status)) {
    throw new Error("Only draft or approved templates can be submitted for review");
  }

  const doc = parseSowDocument(existing.contentJson, {
    standardScope: existing.standardScope,
    addOnsJson: existing.addOnsJson,
  });
  if (doc.scopeItems.length === 0) {
    throw new Error("Add at least one standard scope item before review");
  }

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: { status: "PENDING_REVIEW", active: false },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: sow.version,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: sow.status,
    changeNote: input.changeNote || "Submitted for review",
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.submitted_for_review",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { version: sow.version },
  });

  return sow;
}

export async function approveSow(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
  changeNote?: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");
  if (!["PENDING_REVIEW", "DRAFT"].includes(existing.status)) {
    throw new Error("Template must be pending review (or draft) to approve");
  }

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: {
      status: "APPROVED",
      active: false,
      approvedAt: new Date(),
      approvedById: input.userId,
      approvedByName: input.actorName || null,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: sow.version,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: sow.status,
    changeNote: input.changeNote || `Approved by ${input.actorName || "reviewer"}`,
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.approved",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { version: sow.version, approvedBy: input.actorName },
  });

  return sow;
}

export async function activateSow(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
  changeNote?: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");
  if (existing.status !== "APPROVED" && existing.status !== "ACTIVE") {
    throw new Error("Approve the template before activating it");
  }

  const nextVersion =
    existing.status === "ACTIVE" ? existing.version + 1 : existing.version;

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: {
      status: "ACTIVE",
      active: true,
      publishedAt: new Date(),
      version: nextVersion,
      approvedAt: existing.approvedAt ?? new Date(),
      approvedById: existing.approvedById ?? input.userId,
      approvedByName: existing.approvedByName ?? input.actorName ?? null,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: nextVersion,
    name: sow.name,
    description: sow.description,
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
    contentJson: sow.contentJson,
    slaMinutes: sow.slaMinutes,
    completionDeadlineMinutes: sow.completionDeadlineMinutes,
    useCase: sow.useCase,
    unitType: sow.unitType,
    propertyGroup: sow.propertyGroup,
    status: "ACTIVE",
    changeNote: input.changeNote || "Activated for property use",
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.activated",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { version: sow.version },
  });

  return sow;
}

export async function archiveSow(input: {
  companyId: string;
  userId: string;
  sowId: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED", active: false },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.archived",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { version: sow.version },
  });

  return sow;
}

export async function restoreSowDraft(input: {
  companyId: string;
  userId: string;
  sowId: string;
}) {
  const existing = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOW template not found");

  const sow = await prisma.sow.update({
    where: { id: existing.id },
    data: {
      status: "DRAFT",
      active: false,
      publishedAt: null,
      approvedAt: null,
      approvedById: null,
      approvedByName: null,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.restored_draft",
    entityType: "Sow",
    entityId: sow.id,
  });

  return sow;
}

export async function linkPropertiesToSow(input: {
  companyId: string;
  sowId: string;
  propertyIds: string[];
  userId: string;
  accessScope: AccessScope;
}) {
  const sow = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!sow) throw new Error("SOW template not found");

  const ids = await assertPropertyIdsAuthorizedForLink(
    input.companyId,
    input.accessScope,
    input.propertyIds
  );

  await prisma.property.updateMany({
    where: {
      companyId: input.companyId,
      sowId: input.sowId,
      id: { notIn: ids.length ? ids : ["__none__"] },
      ...propertyLinkMutationScopeWhere(input.accessScope),
    },
    data: { sowId: null },
  });

  if (ids.length) {
    await prisma.property.updateMany({
      where: {
        companyId: input.companyId,
        id: { in: ids },
        ...propertyLinkMutationScopeWhere(input.accessScope),
      },
      data: { sowId: input.sowId },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.properties_linked",
    entityType: "Sow",
    entityId: input.sowId,
    metadata: { propertyIds: ids },
  });

  return ids;
}

export async function restoreSowVersion(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sowId: string;
  versionId: string;
}) {
  const sow = await prisma.sow.findFirst({
    where: { id: input.sowId, companyId: input.companyId },
  });
  if (!sow) throw new Error("SOW template not found");

  const version = await prisma.sowVersion.findFirst({
    where: { id: input.versionId, sowId: sow.id },
  });
  if (!version) throw new Error("Version not found");

  const nextVersion = sow.version + 1;
  const updated = await prisma.sow.update({
    where: { id: sow.id },
    data: {
      name: version.name,
      description: version.description,
      standardScope: version.standardScope,
      addOnsJson: version.addOnsJson,
      contentJson: version.contentJson,
      slaMinutes: version.slaMinutes,
      completionDeadlineMinutes: version.completionDeadlineMinutes,
      useCase: version.useCase,
      unitType: version.unitType,
      propertyGroup: version.propertyGroup,
      version: nextVersion,
      status: "DRAFT",
      active: false,
      publishedAt: null,
      approvedAt: null,
      approvedById: null,
      approvedByName: null,
    },
  });

  await snapshotVersion({
    sowId: sow.id,
    version: nextVersion,
    name: version.name,
    description: version.description,
    standardScope: version.standardScope,
    addOnsJson: version.addOnsJson,
    contentJson: version.contentJson,
    slaMinutes: version.slaMinutes,
    completionDeadlineMinutes: version.completionDeadlineMinutes,
    useCase: version.useCase,
    unitType: version.unitType,
    propertyGroup: version.propertyGroup,
    status: "DRAFT",
    changeNote: `Restored from v${version.version}`,
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sow.version_restored",
    entityType: "Sow",
    entityId: sow.id,
    metadata: { fromVersion: version.version, toVersion: nextVersion },
  });

  return updated;
}

/** Helpers for turnovers / property displays */
export function getSowSlaMinutes(sow: { slaMinutes: number; completionDeadlineMinutes?: number | null }) {
  return sow.completionDeadlineMinutes || sow.slaMinutes || 240;
}

export function getSowPhotoCount(sow: {
  contentJson?: string | null;
  standardScope?: string;
  addOnsJson?: string;
}) {
  const doc = parseSowDocument(sow.contentJson, {
    standardScope: sow.standardScope,
    addOnsJson: sow.addOnsJson,
  });
  return doc.photoRequirements.filter((p) => p.required).length || 4;
}
