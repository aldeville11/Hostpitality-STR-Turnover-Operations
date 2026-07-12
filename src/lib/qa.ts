import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parsePhotoRequirements } from "./properties";
import { parseSowDocument } from "./sows";
import { recordStatusChange } from "./turnovers";

export const QA_STATUSES = ["PENDING", "APPROVED", "REJECTED", "NEEDS_REWORK"] as const;
export type QaStatus = (typeof QA_STATUSES)[number];

export const QA_STATUS_LABELS: Record<QaStatus, string> = {
  PENDING: "Pending QA",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_REWORK: "Needs rework",
};

export const QA_ITEM_RESULTS = ["PENDING", "PASS", "FAIL", "NA"] as const;
export type QaItemResult = (typeof QA_ITEM_RESULTS)[number];

export const QUEUE_TURNOVER_STATUSES = ["READY_FOR_QA", "NEEDS_REWORK"] as const;

export function qaStatusTone(
  status: string
): "neutral" | "success" | "warning" | "danger" | "info" | "accent" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "NEEDS_REWORK":
      return "warning";
    case "PENDING":
      return "info";
    default:
      return "neutral";
  }
}

async function recordQaEvent(input: {
  inspectionId: string;
  turnoverId: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string;
  actorId?: string | null;
  actorName?: string | null;
}) {
  return prisma.qaInspectionEvent.create({
    data: {
      inspectionId: input.inspectionId,
      turnoverId: input.turnoverId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      note: input.note,
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
    },
  });
}

export async function listQaQueue(
  companyId: string,
  filters?: {
    status?: string;
    propertyId?: string;
    inspectorId?: string;
    q?: string;
  }
) {
  // Queue shows turnovers awaiting/in QA, plus recent closed QA for context when filtered
  const qaStatusFilter = filters?.status
    ? filters.status === "PENDING"
      ? { status: { in: ["READY_FOR_QA", "NEEDS_REWORK"] } }
      : filters.status === "APPROVED"
        ? { status: "COMPLETED" }
        : filters.status === "NEEDS_REWORK"
          ? { status: "NEEDS_REWORK" }
          : filters.status === "REJECTED"
            ? {
                qaInspections: {
                  some: { status: "REJECTED" },
                },
              }
            : {}
    : { status: { in: [...QUEUE_TURNOVER_STATUSES] } };

  const turnovers = await prisma.turnover.findMany({
    where: {
      companyId,
      ...qaStatusFilter,
      ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters?.inspectorId
        ? {
            qaInspections: {
              some: { inspectorId: filters.inspectorId },
            },
          }
        : {}),
      ...(filters?.q
        ? {
            OR: [
              { property: { name: { contains: filters.q } } },
              { property: { unitCode: { contains: filters.q } } },
              { vendor: { name: { contains: filters.q } } },
            ],
          }
        : {}),
    },
    include: {
      property: true,
      vendor: true,
      checklistItems: true,
      qaInspections: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [{ deadlineAt: "asc" }, { priority: "asc" }],
    take: 80,
  });

  const priorityRank: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    NORMAL: 2,
    LOW: 3,
  };

  return [...turnovers]
    .sort((a, b) => {
      const byDeadline = a.deadlineAt.getTime() - b.deadlineAt.getTime();
      if (byDeadline !== 0) return byDeadline;
      return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
    })
    .map((t) => {
      const latestQa = t.qaInspections[0] ?? null;
      const checklistDone = t.checklistItems.filter((i) => i.completed).length;
      return {
        ...t,
        latestQa,
        qaStatus: (latestQa?.status as QaStatus | undefined) ??
          (t.status === "COMPLETED"
            ? "APPROVED"
            : t.status === "NEEDS_REWORK"
              ? "NEEDS_REWORK"
              : "PENDING"),
        checklistProgress: {
          done: checklistDone,
          total: t.checklistItems.length,
        },
      };
    });
}

export async function ensureQaInspection(input: {
  companyId: string;
  turnoverId: string;
  userId: string;
  actorName?: string;
  claim?: boolean;
}) {
  const turnover = await prisma.turnover.findFirst({
    where: { id: input.turnoverId, companyId: input.companyId },
    include: {
      property: true,
      sow: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
      qaInspections: {
        where: { status: { in: ["PENDING", "NEEDS_REWORK"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { items: true, photos: true },
      },
    },
  });
  if (!turnover) throw new Error("Turnover not found");

  const open = turnover.qaInspections[0];
  if (open) {
    if (input.claim && !open.inspectorId) {
      const claimed = await prisma.qaInspection.update({
        where: { id: open.id },
        data: {
          inspectorId: input.userId,
          inspectorName: input.actorName ?? null,
          startedAt: open.startedAt ?? new Date(),
        },
      });
      await recordQaEvent({
        inspectionId: open.id,
        turnoverId: turnover.id,
        fromStatus: open.status,
        toStatus: open.status,
        note: "Inspector claimed QA",
        actorId: input.userId,
        actorName: input.actorName,
      });
      return claimed;
    }
    return open;
  }

  // Create new inspection from checklist + photo requirements
  const photoReqs = turnover.sow
    ? parseSowDocument(turnover.sow.contentJson, {
        standardScope: turnover.sow.standardScope,
        addOnsJson: turnover.sow.addOnsJson,
      }).photoRequirements
    : parsePhotoRequirements(turnover.property.photoRequirementsJson).map((p, idx) => ({
        id: `photo_${idx}`,
        label: p.label,
        required: p.required,
        count: 1,
      }));

  const uploadedCount = turnover.photosUploaded;
  const inspection = await prisma.qaInspection.create({
    data: {
      companyId: input.companyId,
      turnoverId: turnover.id,
      status: "PENDING",
      inspectorId: input.claim ? input.userId : null,
      inspectorName: input.claim ? input.actorName ?? null : null,
      startedAt: input.claim ? new Date() : null,
      items: {
        create: turnover.checklistItems.map((item, idx) => ({
          checklistItemId: item.id,
          section: item.section,
          title: item.title,
          result: "PENDING",
          sortOrder: idx,
        })),
      },
      photos: {
        create: (photoReqs.length
          ? photoReqs
          : [
              { label: "Kitchen after clean", required: true, count: 1 },
              { label: "Bathroom after clean", required: true, count: 1 },
              { label: "Bedroom staged", required: true, count: 1 },
              { label: "Final living room", required: true, count: 1 },
            ]
        ).map((photo, idx) => ({
          label: photo.label,
          required: "required" in photo ? Boolean(photo.required) : true,
          uploaded: idx < uploadedCount,
          result: "PENDING",
          sortOrder: idx,
        })),
      },
    },
  });

  await recordQaEvent({
    inspectionId: inspection.id,
    turnoverId: turnover.id,
    fromStatus: null,
    toStatus: "PENDING",
    note: "QA inspection opened",
    actorId: input.userId,
    actorName: input.actorName,
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "qa.inspection_opened",
    entityType: "QaInspection",
    entityId: inspection.id,
    metadata: { turnoverId: turnover.id },
  });

  return inspection;
}

export async function getQaDetail(companyId: string, turnoverId: string) {
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId },
    include: {
      property: { include: { defaultVendor: true } },
      vendor: true,
      booking: true,
      sop: true,
      sow: true,
      checklistItems: { orderBy: { sortOrder: "asc" } },
      statusEvents: { orderBy: { createdAt: "asc" } },
      assignmentEvents: { orderBy: { createdAt: "desc" }, take: 5 },
      qaInspections: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { orderBy: { sortOrder: "asc" } },
          photos: { orderBy: { sortOrder: "asc" } },
          events: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!turnover) return null;

  const inspectors = await prisma.user.findMany({
    where: {
      companyId,
      role: {
        in: [
          "OWNER_OPERATOR",
          "PROPERTY_MANAGER",
          "CLEANING_COORDINATOR",
          "OPS_MANAGER",
          "CLEANER",
        ],
      },
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const properties = await prisma.property.findMany({
    where: { companyId, active: true },
    select: { id: true, name: true, unitCode: true },
    orderBy: { name: "asc" },
  });

  const latest = turnover.qaInspections[0] ?? null;
  const history = turnover.qaInspections;

  return {
    turnover,
    latestInspection: latest,
    inspections: history,
    inspectors,
    properties,
  };
}

export function evaluateApprovalReadiness(inspection: {
  items: Array<{ result: string; title: string }>;
  photos: Array<{ result: string; required: boolean; uploaded: boolean; label: string }>;
  overrideIncomplete: boolean;
}) {
  const pendingItems = inspection.items.filter((i) => i.result === "PENDING");
  const failedItems = inspection.items.filter((i) => i.result === "FAIL");
  const pendingPhotos = inspection.photos.filter(
    (p) => p.required && p.result === "PENDING"
  );
  const failedPhotos = inspection.photos.filter((p) => p.required && p.result === "FAIL");
  const missingPhotos = inspection.photos.filter(
    (p) => p.required && !p.uploaded && p.result !== "NA"
  );

  const blockers: string[] = [];
  if (pendingItems.length) {
    blockers.push(`${pendingItems.length} checklist item(s) still pending review`);
  }
  if (failedItems.length && !inspection.overrideIncomplete) {
    blockers.push(`${failedItems.length} failed checklist item(s) — reject or override`);
  }
  if (pendingPhotos.length) {
    blockers.push(`${pendingPhotos.length} photo(s) still pending review`);
  }
  if (failedPhotos.length && !inspection.overrideIncomplete) {
    blockers.push(`${failedPhotos.length} failed photo(s) — reject or override`);
  }
  if (missingPhotos.length && !inspection.overrideIncomplete) {
    blockers.push(`${missingPhotos.length} required photo(s) missing`);
  }

  return {
    canApprove: blockers.length === 0 || inspection.overrideIncomplete,
    blockers,
    failedItems,
    failedPhotos,
    pendingItems,
    pendingPhotos,
  };
}

export async function updateQaItemResult(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  itemId: string;
  result: QaItemResult;
  comment?: string;
}) {
  const item = await prisma.qaInspectionItem.findUnique({
    where: { id: input.itemId },
    include: { inspection: true },
  });
  if (!item || item.inspection.companyId !== input.companyId) {
    throw new Error("QA item not found");
  }
  if (!["PENDING", "NEEDS_REWORK"].includes(item.inspection.status)) {
    throw new Error("Inspection is closed");
  }
  if (input.result === "FAIL" && !input.comment?.trim()) {
    throw new Error("Add a comment for failed items");
  }

  const updated = await prisma.qaInspectionItem.update({
    where: { id: item.id },
    data: {
      result: input.result,
      comment: input.comment?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  if (!item.inspection.inspectorId) {
    await prisma.qaInspection.update({
      where: { id: item.inspectionId },
      data: {
        inspectorId: input.userId,
        inspectorName: input.actorName ?? null,
        startedAt: item.inspection.startedAt ?? new Date(),
      },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "qa.item_reviewed",
    entityType: "QaInspectionItem",
    entityId: item.id,
    metadata: { result: input.result, inspectionId: item.inspectionId },
  });

  return updated;
}

export async function updateQaPhotoResult(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  photoId: string;
  result: QaItemResult;
  comment?: string;
}) {
  const photo = await prisma.qaPhotoReview.findUnique({
    where: { id: input.photoId },
    include: { inspection: true },
  });
  if (!photo || photo.inspection.companyId !== input.companyId) {
    throw new Error("Photo review not found");
  }
  if (!["PENDING", "NEEDS_REWORK"].includes(photo.inspection.status)) {
    throw new Error("Inspection is closed");
  }
  if (input.result === "FAIL" && !input.comment?.trim()) {
    throw new Error("Add a comment for failed photos");
  }

  const updated = await prisma.qaPhotoReview.update({
    where: { id: photo.id },
    data: {
      result: input.result,
      comment: input.comment?.trim() || null,
      reviewedAt: new Date(),
    },
  });

  if (!photo.inspection.inspectorId) {
    await prisma.qaInspection.update({
      where: { id: photo.inspectionId },
      data: {
        inspectorId: input.userId,
        inspectorName: input.actorName ?? null,
        startedAt: photo.inspection.startedAt ?? new Date(),
      },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "qa.photo_reviewed",
    entityType: "QaPhotoReview",
    entityId: photo.id,
    metadata: { result: input.result, inspectionId: photo.inspectionId },
  });

  return updated;
}

export async function decideQaInspection(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  inspectionId: string;
  decision: "APPROVED" | "REJECTED" | "NEEDS_REWORK";
  decisionNote?: string;
  overrideIncomplete?: boolean;
}) {
  const inspection = await prisma.qaInspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
    include: {
      items: true,
      photos: true,
      turnover: true,
    },
  });
  if (!inspection) throw new Error("Inspection not found");
  if (!["PENDING", "NEEDS_REWORK"].includes(inspection.status)) {
    throw new Error("Inspection already decided");
  }

  if (input.overrideIncomplete) {
    await prisma.qaInspection.update({
      where: { id: inspection.id },
      data: { overrideIncomplete: true },
    });
    inspection.overrideIncomplete = true;
  }

  if (input.decision === "APPROVED") {
    const readiness = evaluateApprovalReadiness(inspection);
    if (!readiness.canApprove) {
      throw new Error(readiness.blockers[0] || "Cannot approve yet");
    }
  }

  if (
    (input.decision === "REJECTED" || input.decision === "NEEDS_REWORK") &&
    !input.decisionNote?.trim()
  ) {
    throw new Error("Add a decision note for rejection or rework");
  }

  const fromStatus = inspection.status;
  const completedAt = new Date();

  const updated = await prisma.qaInspection.update({
    where: { id: inspection.id },
    data: {
      status: input.decision,
      decisionNote: input.decisionNote?.trim() || null,
      overrideIncomplete: Boolean(input.overrideIncomplete) || inspection.overrideIncomplete,
      inspectorId: inspection.inspectorId ?? input.userId,
      inspectorName: inspection.inspectorName ?? input.actorName ?? null,
      startedAt: inspection.startedAt ?? completedAt,
      completedAt,
    },
  });

  await recordQaEvent({
    inspectionId: inspection.id,
    turnoverId: inspection.turnoverId,
    fromStatus,
    toStatus: input.decision,
    note: input.decisionNote,
    actorId: input.userId,
    actorName: input.actorName,
  });

  // Sync turnover lifecycle
  let nextTurnoverStatus = inspection.turnover.status;
  if (input.decision === "APPROVED") {
    nextTurnoverStatus = "COMPLETED";
    const verified = inspection.photos.filter((p) => p.result === "PASS").length;
    await prisma.turnover.update({
      where: { id: inspection.turnoverId },
      data: {
        status: "COMPLETED",
        photosVerified: Math.max(inspection.turnover.photosVerified, verified),
      },
    });
  } else if (input.decision === "NEEDS_REWORK" || input.decision === "REJECTED") {
    nextTurnoverStatus = "NEEDS_REWORK";
    await prisma.turnover.update({
      where: { id: inspection.turnoverId },
      data: { status: "NEEDS_REWORK" },
    });
  }

  if (nextTurnoverStatus !== inspection.turnover.status) {
    await recordStatusChange({
      turnoverId: inspection.turnoverId,
      fromStatus: inspection.turnover.status,
      toStatus: nextTurnoverStatus,
      note: `QA ${input.decision.toLowerCase().replace("_", " ")}`,
      actorId: input.userId,
      actorName: input.actorName,
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "qa.decision",
    entityType: "QaInspection",
    entityId: inspection.id,
    metadata: {
      decision: input.decision,
      turnoverId: inspection.turnoverId,
      override: Boolean(input.overrideIncomplete),
    },
  });

  return updated;
}

export async function setQaOverride(input: {
  companyId: string;
  userId: string;
  inspectionId: string;
  overrideIncomplete: boolean;
}) {
  const inspection = await prisma.qaInspection.findFirst({
    where: { id: input.inspectionId, companyId: input.companyId },
  });
  if (!inspection) throw new Error("Inspection not found");

  return prisma.qaInspection.update({
    where: { id: inspection.id },
    data: { overrideIncomplete: input.overrideIncomplete },
  });
}
