import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";

export const SOP_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type SopStatus = (typeof SOP_STATUSES)[number];

export const SOP_SECTION_KINDS = [
  "prep",
  "room",
  "checklist",
  "deep_clean",
  "restock",
  "safety",
  "signoff",
  "custom",
] as const;
export type SopSectionKind = (typeof SOP_SECTION_KINDS)[number];

export const SOP_STEP_KINDS = ["task", "checklist", "safety", "deep_clean", "restock"] as const;
export type SopStepKind = (typeof SOP_STEP_KINDS)[number];

export type SopStep = {
  id: string;
  title: string;
  instructions?: string;
  requiresPhoto?: boolean;
  kind?: SopStepKind;
};

export type SopSection = {
  id: string;
  title: string;
  kind: SopSectionKind;
  room?: string;
  notes?: string;
  steps: SopStep[];
};

export type SopDocument = {
  version: 1;
  sections: SopSection[];
  safetyNotes?: string;
};

export const SECTION_KIND_LABELS: Record<SopSectionKind, string> = {
  prep: "Pre-turnover prep",
  room: "Room-by-room",
  checklist: "Checklist",
  deep_clean: "Deep clean",
  restock: "Restock",
  safety: "Safety",
  signoff: "Completion sign-off",
  custom: "Custom",
};

export const STATUS_LABELS: Record<SopStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function newId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyDocument(safetyNotes = ""): SopDocument {
  return { version: 1, sections: [], safetyNotes };
}

export function makeStep(partial?: Partial<SopStep>): SopStep {
  return {
    id: partial?.id ?? newId("step"),
    title: partial?.title ?? "New step",
    instructions: partial?.instructions ?? "",
    requiresPhoto: partial?.requiresPhoto ?? false,
    kind: partial?.kind ?? "task",
  };
}

export function makeSection(partial?: Partial<SopSection>): SopSection {
  return {
    id: partial?.id ?? newId("sec"),
    title: partial?.title ?? "New section",
    kind: partial?.kind ?? "custom",
    room: partial?.room,
    notes: partial?.notes ?? "",
    steps: partial?.steps ?? [makeStep({ title: "First task" })],
  };
}

/** Accept structured documents or legacy flat step arrays. */
export function parseSopDocument(raw: string | null | undefined, safetyNotesFallback = ""): SopDocument {
  const parsed = parseJson<unknown>(raw, null);
  if (!parsed) return emptyDocument(safetyNotesFallback);

  if (Array.isArray(parsed)) {
    const grouped = new Map<string, SopStep[]>();
    for (const item of parsed as Array<{
      section?: string;
      title?: string;
      instructions?: string;
      requiresPhoto?: boolean;
    }>) {
      if (!item?.title) continue;
      const sectionTitle = item.section || "General";
      const list = grouped.get(sectionTitle) ?? [];
      list.push(
        makeStep({
          title: item.title,
          instructions: item.instructions,
          requiresPhoto: item.requiresPhoto,
        })
      );
      grouped.set(sectionTitle, list);
    }
    const sections = [...grouped.entries()].map(([title, steps]) =>
      makeSection({
        title,
        kind: inferSectionKind(title),
        steps,
      })
    );
    return { version: 1, sections, safetyNotes: safetyNotesFallback };
  }

  if (typeof parsed === "object" && parsed !== null && "sections" in parsed) {
    const doc = parsed as SopDocument;
    return {
      version: 1,
      safetyNotes: doc.safetyNotes ?? safetyNotesFallback,
      sections: Array.isArray(doc.sections)
        ? doc.sections.map((section) => ({
            id: section.id || newId("sec"),
            title: section.title || "Untitled",
            kind: (SOP_SECTION_KINDS.includes(section.kind) ? section.kind : "custom") as SopSectionKind,
            room: section.room,
            notes: section.notes ?? "",
            steps: Array.isArray(section.steps)
              ? section.steps.map((step) =>
                  makeStep({
                    id: step.id,
                    title: step.title || "Untitled step",
                    instructions: step.instructions,
                    requiresPhoto: step.requiresPhoto,
                    kind: step.kind,
                  })
                )
              : [],
          }))
        : [],
    };
  }

  return emptyDocument(safetyNotesFallback);
}

function inferSectionKind(title: string): SopSectionKind {
  const t = title.toLowerCase();
  if (t.includes("prep")) return "prep";
  if (t.includes("room")) return "room";
  if (t.includes("deep")) return "deep_clean";
  if (t.includes("restock")) return "restock";
  if (t.includes("safety")) return "safety";
  if (t.includes("sign") || t.includes("completion")) return "signoff";
  if (t.includes("check")) return "checklist";
  return "custom";
}

export function serializeSopDocument(doc: SopDocument) {
  return JSON.stringify({
    version: 1,
    safetyNotes: doc.safetyNotes ?? "",
    sections: doc.sections,
  });
}

/** Flat checklist rows for turnover generation (and legacy consumers). */
export function flattenSopSteps(doc: SopDocument) {
  const rows: Array<{
    section: string;
    title: string;
    instructions: string | null;
    requiresPhoto: boolean;
    sortOrder: number;
  }> = [];
  let order = 0;
  for (const section of doc.sections) {
    const sectionLabel =
      section.kind === "room" && section.room
        ? `${section.title}: ${section.room}`
        : section.title || SECTION_KIND_LABELS[section.kind];
    for (const step of section.steps) {
      if (!step.title.trim()) continue;
      rows.push({
        section: sectionLabel,
        title: step.title.trim(),
        instructions: step.instructions?.trim() || null,
        requiresPhoto: Boolean(step.requiresPhoto),
        sortOrder: order++,
      });
    }
  }
  return rows;
}

export function countSteps(doc: SopDocument) {
  return doc.sections.reduce((sum, s) => sum + s.steps.length, 0);
}

export type SopTemplate = {
  key: string;
  name: string;
  description: string;
  unitType: string;
  safetyNotes: string;
  document: SopDocument;
};

function templateSections(
  sections: Array<{
    title: string;
    kind: SopSectionKind;
    room?: string;
    notes?: string;
    steps?: Array<Partial<SopStep> & { title: string }>;
  }>
): SopSection[] {
  return sections.map((s) =>
    makeSection({
      title: s.title,
      kind: s.kind,
      room: s.room,
      notes: s.notes,
      steps: (s.steps ?? []).map((step) => makeStep(step)),
    })
  );
}

export const SOP_TEMPLATES: SopTemplate[] = [
  {
    key: "studio_turnover",
    name: "Studio turnover",
    description: "Compact studio playbook with kitchenette, bath, and living zone.",
    unitType: "studio",
    safetyNotes: "Confirm gas/electric appliances are off before leaving. Never mix bleach and ammonia.",
    document: {
      version: 1,
      safetyNotes: "Confirm gas/electric appliances are off before leaving. Never mix bleach and ammonia.",
      sections: templateSections([
        {
          title: "Pre-turnover prep",
          kind: "prep",
          steps: [
            { title: "Confirm guest checkout", instructions: "Check lockbox / PMS for departure." },
            { title: "Load supply caddy", instructions: "Linens, trash bags, glass cleaner, microfiber." },
          ],
        },
        {
          title: "Living / sleep zone",
          kind: "room",
          room: "Studio",
          steps: [
            { title: "Strip and remake bed", requiresPhoto: true },
            { title: "Dust surfaces and tidy staging" },
            { title: "Vacuum and mop floors" },
          ],
        },
        {
          title: "Kitchenette",
          kind: "room",
          room: "Kitchen",
          steps: [
            { title: "Clean counters, sink, and appliances", requiresPhoto: true },
            { title: "Empty trash and replace liner" },
          ],
        },
        {
          title: "Bathroom",
          kind: "room",
          room: "Bath",
          steps: [
            { title: "Scrub shower, toilet, sink", requiresPhoto: true },
            { title: "Restock toilet paper and towels", kind: "restock" },
          ],
        },
        {
          title: "Restock",
          kind: "restock",
          steps: [
            { title: "Coffee / tea basics", kind: "restock" },
            { title: "Paper goods to par", kind: "restock" },
          ],
        },
        {
          title: "Safety check",
          kind: "safety",
          steps: [
            { title: "Test smoke/CO detectors", kind: "safety" },
            { title: "Secure windows and lock up", kind: "safety" },
          ],
        },
        {
          title: "Sign-off",
          kind: "signoff",
          steps: [{ title: "Final walkthrough photo", requiresPhoto: true }],
        },
      ]),
    },
  },
  {
    key: "apartment_2br",
    name: "2BR apartment turnover",
    description: "Room-by-room apartment playbook with deep-clean and restock blocks.",
    unitType: "apartment",
    safetyNotes: "Wear gloves for chemical cleaners. Report water damage immediately.",
    document: {
      version: 1,
      safetyNotes: "Wear gloves for chemical cleaners. Report water damage immediately.",
      sections: templateSections([
        {
          title: "Pre-turnover prep",
          kind: "prep",
          steps: [
            { title: "Confirm checkout and gather keys" },
            { title: "Review owner notes and add-ons" },
            { title: "Stage linens by bedroom" },
          ],
        },
        {
          title: "Kitchen",
          kind: "room",
          room: "Kitchen",
          steps: [
            { title: "Clean appliances inside/out", requiresPhoto: true },
            { title: "Wipe cabinets and counters" },
            { title: "Sweep and mop floors" },
          ],
        },
        {
          title: "Living room",
          kind: "room",
          room: "Living",
          steps: [
            { title: "Dust and fluff staging", requiresPhoto: true },
            { title: "Vacuum rugs and under furniture" },
          ],
        },
        {
          title: "Primary bedroom",
          kind: "room",
          room: "Bedroom 1",
          steps: [
            { title: "Remake bed with fresh linens", requiresPhoto: true },
            { title: "Empty trash and wipe surfaces" },
          ],
        },
        {
          title: "Second bedroom",
          kind: "room",
          room: "Bedroom 2",
          steps: [
            { title: "Remake bed", requiresPhoto: true },
            { title: "Vacuum and reset closet" },
          ],
        },
        {
          title: "Bathrooms",
          kind: "room",
          room: "Baths",
          steps: [
            { title: "Deep scrub tub/shower", kind: "deep_clean", requiresPhoto: true },
            { title: "Sanitize toilet and sink" },
            { title: "Replace towels and bath mat", kind: "restock" },
          ],
        },
        {
          title: "Deep clean extras",
          kind: "deep_clean",
          notes: "Run on checkout after 7+ night stays or when flagged.",
          steps: [
            { title: "Wipe baseboards and switches", kind: "deep_clean" },
            { title: "Descale shower head", kind: "deep_clean" },
          ],
        },
        {
          title: "Restock",
          kind: "restock",
          steps: [
            { title: "Toilet paper & paper towels to par", kind: "restock" },
            { title: "Dish pods, trash bags, toiletries", kind: "restock" },
          ],
        },
        {
          title: "Safety",
          kind: "safety",
          steps: [
            { title: "Check detectors and extinguisher", kind: "safety" },
            { title: "Verify locks and smart devices", kind: "safety" },
          ],
        },
        {
          title: "Completion",
          kind: "signoff",
          steps: [
            { title: "Photo proof set", requiresPhoto: true },
            { title: "Sign off ready for QA" },
          ],
        },
      ]),
    },
  },
  {
    key: "house_full",
    name: "House / multi-level turnover",
    description: "Larger home template with exterior touchpoints and room groups.",
    unitType: "house",
    safetyNotes: "Secure garage and exterior doors. Note any pet hazards for the next team.",
    document: {
      version: 1,
      safetyNotes: "Secure garage and exterior doors. Note any pet hazards for the next team.",
      sections: templateSections([
        {
          title: "Arrival & prep",
          kind: "prep",
          steps: [
            { title: "Walk property exterior for trash/damage" },
            { title: "Open windows briefly if odor present" },
            { title: "Map room order top-to-bottom" },
          ],
        },
        {
          title: "Upstairs bedrooms",
          kind: "room",
          room: "Upstairs",
          steps: [
            { title: "Remake all beds", requiresPhoto: true },
            { title: "Empty bins and wipe nightstands" },
          ],
        },
        {
          title: "Main living areas",
          kind: "room",
          room: "Main floor",
          steps: [
            { title: "Kitchen deep clean", kind: "deep_clean", requiresPhoto: true },
            { title: "Living/dining dust and vacuum" },
          ],
        },
        {
          title: "Baths",
          kind: "room",
          room: "All baths",
          steps: [
            { title: "Sanitize each bathroom", requiresPhoto: true },
            { title: "Restock towels and paper goods", kind: "restock" },
          ],
        },
        {
          title: "Laundry / utility",
          kind: "checklist",
          steps: [
            { title: "Start/finish any leftover laundry" },
            { title: "Wipe washer/dryer exteriors" },
          ],
        },
        {
          title: "Restock & staging",
          kind: "restock",
          steps: [
            { title: "Kitchen consumables to par", kind: "restock" },
            { title: "Welcome kit check", kind: "restock" },
          ],
        },
        {
          title: "Safety & lockup",
          kind: "safety",
          steps: [
            { title: "Garage, patio, and entry locks", kind: "safety" },
            { title: "Thermostats reset to house default", kind: "safety" },
          ],
        },
        {
          title: "Sign-off",
          kind: "signoff",
          steps: [{ title: "Final photo set and notes", requiresPhoto: true }],
        },
      ]),
    },
  },
];

export function getTemplate(key: string) {
  return SOP_TEMPLATES.find((t) => t.key === key) ?? null;
}

export async function listSops(
  companyId: string,
  filters?: { status?: string; propertyId?: string; q?: string }
) {
  const sops = await prisma.sop.findMany({
    where: {
      companyId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.q
        ? {
            OR: [
              { name: { contains: filters.q } },
              { description: { contains: filters.q } },
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
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const statusRank: Record<string, number> = {
    PUBLISHED: 0,
    DRAFT: 1,
    ARCHIVED: 2,
  };

  return [...sops]
    .sort((a, b) => {
      const byStatus = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .map((sop) => {
      const doc = parseSopDocument(sop.contentJson, sop.safetyNotes ?? "");
      return {
        ...sop,
        stepCount: countSteps(doc),
        sectionCount: doc.sections.length,
        isActivePublished: sop.status === "PUBLISHED",
      };
    });
}

export async function getSopDetail(companyId: string, sopId: string) {
  const sop = await prisma.sop.findFirst({
    where: { id: sopId, companyId },
    include: {
      properties: {
        select: { id: true, name: true, unitCode: true, unitType: true, active: true },
        orderBy: { name: "asc" },
      },
      versions: { orderBy: { version: "desc" } },
      _count: { select: { turnovers: true } },
    },
  });
  if (!sop) return null;

  const allProperties = await prisma.property.findMany({
    where: { companyId, active: true },
    select: { id: true, name: true, unitCode: true, unitType: true, sopId: true },
    orderBy: { name: "asc" },
  });

  const document = parseSopDocument(sop.contentJson, sop.safetyNotes ?? "");

  return {
    sop,
    document,
    allProperties,
    stepCount: countSteps(document),
  };
}

export async function createSopFromTemplate(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  templateKey: string;
  name?: string;
  propertyIds?: string[];
}) {
  const template = getTemplate(input.templateKey);
  if (!template) throw new Error("Template not found");

  const contentJson = serializeSopDocument(template.document);
  const sop = await prisma.sop.create({
    data: {
      companyId: input.companyId,
      name: input.name?.trim() || template.name,
      description: template.description,
      version: 1,
      contentJson,
      status: "DRAFT",
      templateKey: template.key,
      unitType: template.unitType,
      safetyNotes: template.safetyNotes,
      active: false,
    },
  });

  await prisma.sopVersion.create({
    data: {
      sopId: sop.id,
      version: 1,
      name: sop.name,
      description: sop.description,
      contentJson,
      safetyNotes: sop.safetyNotes,
      changeNote: `Created from template: ${template.name}`,
      actorId: input.userId,
      actorName: input.actorName,
    },
  });

  if (input.propertyIds?.length) {
    await linkPropertiesToSop({
      companyId: input.companyId,
      sopId: sop.id,
      propertyIds: input.propertyIds,
      userId: input.userId,
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.created",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { templateKey: template.key },
  });

  return sop;
}

export async function createBlankSop(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  name: string;
  description?: string;
  unitType?: string;
}) {
  const starter = parseSopDocument(null);
  starter.sections = [
    makeSection({
      title: "Pre-turnover prep",
      kind: "prep",
      steps: [
        makeStep({ title: "Confirm checkout" }),
        makeStep({ title: "Gather supplies" }),
      ],
    }),
    makeSection({
      title: "Room-by-room",
      kind: "room",
      room: "Primary spaces",
      steps: [
        makeStep({ title: "Clean assigned rooms", requiresPhoto: true }),
      ],
    }),
    makeSection({
      title: "Restock",
      kind: "restock",
      steps: [makeStep({ title: "Restock consumables to par", kind: "restock" })],
    }),
    makeSection({
      title: "Safety",
      kind: "safety",
      steps: [makeStep({ title: "Safety walkthrough", kind: "safety" })],
    }),
    makeSection({
      title: "Sign-off",
      kind: "signoff",
      steps: [makeStep({ title: "Ready for QA", requiresPhoto: true })],
    }),
  ];
  starter.safetyNotes = "Follow property chemical and lockup rules.";

  const contentJson = serializeSopDocument(starter);
  const sop = await prisma.sop.create({
    data: {
      companyId: input.companyId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      version: 1,
      contentJson,
      status: "DRAFT",
      unitType: input.unitType || null,
      safetyNotes: starter.safetyNotes,
      active: false,
    },
  });

  await prisma.sopVersion.create({
    data: {
      sopId: sop.id,
      version: 1,
      name: sop.name,
      description: sop.description,
      contentJson,
      safetyNotes: sop.safetyNotes,
      changeNote: "Initial draft",
      actorId: input.userId,
      actorName: input.actorName,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.created",
    entityType: "Sop",
    entityId: sop.id,
  });

  return sop;
}

export async function duplicateSop(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sopId: string;
}) {
  const source = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!source) throw new Error("SOP not found");

  const sop = await prisma.sop.create({
    data: {
      companyId: input.companyId,
      name: `${source.name} (copy)`,
      description: source.description,
      version: 1,
      contentJson: source.contentJson,
      status: "DRAFT",
      templateKey: source.templateKey,
      unitType: source.unitType,
      safetyNotes: source.safetyNotes,
      active: false,
      publishedAt: null,
    },
  });

  await prisma.sopVersion.create({
    data: {
      sopId: sop.id,
      version: 1,
      name: sop.name,
      description: sop.description,
      contentJson: sop.contentJson,
      safetyNotes: sop.safetyNotes,
      changeNote: `Duplicated from ${source.name}`,
      actorId: input.userId,
      actorName: input.actorName,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.duplicated",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { sourceId: source.id },
  });

  return sop;
}

export async function saveSopContent(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sopId: string;
  name: string;
  description?: string;
  unitType?: string;
  safetyNotes?: string;
  document: SopDocument;
  bumpVersion?: boolean;
  changeNote?: string;
}) {
  const existing = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOP not found");
  if (existing.status === "ARCHIVED") throw new Error("Archived SOPs cannot be edited. Duplicate instead.");

  const contentJson = serializeSopDocument({
    ...input.document,
    safetyNotes: input.safetyNotes ?? input.document.safetyNotes,
  });

  const nextVersion = input.bumpVersion ? existing.version + 1 : existing.version;

  const sop = await prisma.sop.update({
    where: { id: existing.id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      unitType: input.unitType || null,
      safetyNotes: input.safetyNotes ?? null,
      contentJson,
      version: nextVersion,
      // Editing a published SOP moves it back to draft until republished
      status: existing.status === "PUBLISHED" && input.bumpVersion ? "DRAFT" : existing.status === "PUBLISHED" ? "DRAFT" : existing.status,
      active: false,
      publishedAt: existing.status === "PUBLISHED" ? null : existing.publishedAt,
    },
  });

  if (input.bumpVersion || nextVersion !== existing.version) {
    await prisma.sopVersion.create({
      data: {
        sopId: sop.id,
        version: nextVersion,
        name: sop.name,
        description: sop.description,
        contentJson,
        safetyNotes: sop.safetyNotes,
        changeNote: input.changeNote || "Content updated",
        actorId: input.userId,
        actorName: input.actorName,
      },
    });
  } else {
    // Keep latest version snapshot in sync when saving draft without bump
    const latest = await prisma.sopVersion.findFirst({
      where: { sopId: sop.id },
      orderBy: { version: "desc" },
    });
    if (latest && latest.version === sop.version) {
      await prisma.sopVersion.update({
        where: { id: latest.id },
        data: {
          name: sop.name,
          description: sop.description,
          contentJson,
          safetyNotes: sop.safetyNotes,
          changeNote: input.changeNote || latest.changeNote || "Draft saved",
        },
      });
    }
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.updated",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { version: sop.version, status: sop.status },
  });

  return sop;
}

export async function publishSop(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sopId: string;
  changeNote?: string;
}) {
  const existing = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOP not found");
  if (existing.status === "ARCHIVED") throw new Error("Cannot publish an archived SOP");

  const doc = parseSopDocument(existing.contentJson, existing.safetyNotes ?? "");
  if (countSteps(doc) === 0) throw new Error("Add at least one step before publishing");

  const nextVersion = existing.status === "PUBLISHED" ? existing.version + 1 : existing.version;

  const sop = await prisma.sop.update({
    where: { id: existing.id },
    data: {
      status: "PUBLISHED",
      active: true,
      publishedAt: new Date(),
      version: nextVersion,
    },
  });

  const versionExists = await prisma.sopVersion.findUnique({
    where: { sopId_version: { sopId: sop.id, version: nextVersion } },
  });

  if (!versionExists) {
    await prisma.sopVersion.create({
      data: {
        sopId: sop.id,
        version: nextVersion,
        name: sop.name,
        description: sop.description,
        contentJson: sop.contentJson,
        safetyNotes: sop.safetyNotes,
        changeNote: input.changeNote || "Published",
        actorId: input.userId,
        actorName: input.actorName,
      },
    });
  } else {
    await prisma.sopVersion.update({
      where: { id: versionExists.id },
      data: {
        changeNote: input.changeNote || "Published",
        contentJson: sop.contentJson,
        safetyNotes: sop.safetyNotes,
        name: sop.name,
        description: sop.description,
      },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.published",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { version: sop.version },
  });

  return sop;
}

export async function archiveSop(input: {
  companyId: string;
  userId: string;
  sopId: string;
}) {
  const existing = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOP not found");

  const sop = await prisma.sop.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED", active: false },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.archived",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { version: sop.version },
  });

  return sop;
}

export async function restoreSopDraft(input: {
  companyId: string;
  userId: string;
  sopId: string;
}) {
  const existing = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!existing) throw new Error("SOP not found");

  const sop = await prisma.sop.update({
    where: { id: existing.id },
    data: { status: "DRAFT", active: false, publishedAt: null },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.restored_draft",
    entityType: "Sop",
    entityId: sop.id,
  });

  return sop;
}

export async function linkPropertiesToSop(input: {
  companyId: string;
  sopId: string;
  propertyIds: string[];
  userId: string;
}) {
  const sop = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!sop) throw new Error("SOP not found");

  const properties = await prisma.property.findMany({
    where: { companyId: input.companyId, id: { in: input.propertyIds } },
    select: { id: true },
  });
  const ids = properties.map((p) => p.id);

  // Unlink properties currently pointing at this SOP but not in the new set
  await prisma.property.updateMany({
    where: {
      companyId: input.companyId,
      sopId: input.sopId,
      id: { notIn: ids.length ? ids : ["__none__"] },
    },
    data: { sopId: null },
  });

  if (ids.length) {
    await prisma.property.updateMany({
      where: { companyId: input.companyId, id: { in: ids } },
      data: { sopId: input.sopId },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.properties_linked",
    entityType: "Sop",
    entityId: input.sopId,
    metadata: { propertyIds: ids },
  });

  return ids;
}

export async function restoreSopVersion(input: {
  companyId: string;
  userId: string;
  actorName?: string;
  sopId: string;
  versionId: string;
}) {
  const sop = await prisma.sop.findFirst({
    where: { id: input.sopId, companyId: input.companyId },
  });
  if (!sop) throw new Error("SOP not found");

  const version = await prisma.sopVersion.findFirst({
    where: { id: input.versionId, sopId: sop.id },
  });
  if (!version) throw new Error("Version not found");

  const nextVersion = sop.version + 1;
  const updated = await prisma.sop.update({
    where: { id: sop.id },
    data: {
      name: version.name,
      description: version.description,
      contentJson: version.contentJson,
      safetyNotes: version.safetyNotes,
      version: nextVersion,
      status: "DRAFT",
      active: false,
      publishedAt: null,
    },
  });

  await prisma.sopVersion.create({
    data: {
      sopId: sop.id,
      version: nextVersion,
      name: version.name,
      description: version.description,
      contentJson: version.contentJson,
      safetyNotes: version.safetyNotes,
      changeNote: `Restored from v${version.version}`,
      actorId: input.userId,
      actorName: input.actorName,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "sop.version_restored",
    entityType: "Sop",
    entityId: sop.id,
    metadata: { fromVersion: version.version, toVersion: nextVersion },
  });

  return updated;
}
