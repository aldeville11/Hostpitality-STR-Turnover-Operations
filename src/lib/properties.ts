import { prisma } from "./db";
import { parseJson } from "./json";

export type PhotoRequirement = {
  label: string;
  required: boolean;
};

export type RestockDefault = {
  name: string;
  quantity: number;
  unit: string;
};

export const UNIT_TYPES = [
  "studio",
  "apartment",
  "house",
  "condo",
  "cabin",
  "other",
] as const;

export const BOOKING_SOURCES = [
  "manual",
  "airbnb",
  "vrbo",
  "booking_com",
  "direct",
  "pms",
] as const;

export const DEFAULT_PHOTO_REQUIREMENTS: PhotoRequirement[] = [
  { label: "Kitchen after clean", required: true },
  { label: "Bathroom after clean", required: true },
  { label: "Bedroom staged", required: true },
  { label: "Final living room", required: true },
];

export const DEFAULT_RESTOCK: RestockDefault[] = [
  { name: "Toilet paper", quantity: 4, unit: "rolls" },
  { name: "Paper towels", quantity: 2, unit: "rolls" },
  { name: "Dishwasher pods", quantity: 4, unit: "pods" },
  { name: "Trash bags", quantity: 1, unit: "box" },
];

export function parsePhotoRequirements(raw: string | null | undefined): PhotoRequirement[] {
  const parsed = parseJson<PhotoRequirement[]>(raw, DEFAULT_PHOTO_REQUIREMENTS);
  return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_PHOTO_REQUIREMENTS;
}

export function parseRestockDefaults(raw: string | null | undefined): RestockDefault[] {
  const parsed = parseJson<RestockDefault[]>(raw, DEFAULT_RESTOCK);
  return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_RESTOCK;
}

export type TurnoverReadiness = {
  score: number;
  label: "Ready" | "Almost ready" | "Needs setup";
  missing: string[];
};

export function getTurnoverReadiness(property: {
  sopId: string | null;
  sowId: string | null;
  defaultVendorId: string | null;
  calendarUrl: string | null;
  calendarStatus: string;
  bookingSource: string;
  photoRequirementsJson: string;
  restockDefaultsJson: string;
  active: boolean;
}): TurnoverReadiness {
  const missing: string[] = [];
  if (!property.active) missing.push("Property inactive");
  if (!property.sopId) missing.push("SOP");
  if (!property.sowId) missing.push("SOW template");
  if (!property.defaultVendorId) missing.push("Default cleaner");
  if (!property.calendarUrl && property.bookingSource === "manual") {
    missing.push("Calendar / booking source");
  }
  const photos = parsePhotoRequirements(property.photoRequirementsJson);
  if (!photos.some((p) => p.required)) missing.push("Photo requirements");
  const restock = parseRestockDefaults(property.restockDefaultsJson);
  if (!restock.length) missing.push("Restock defaults");

  const checks = 6;
  const done = checks - missing.length;
  const score = Math.max(0, Math.round((done / checks) * 100));

  let label: TurnoverReadiness["label"] = "Needs setup";
  if (score >= 85) label = "Ready";
  else if (score >= 50) label = "Almost ready";

  return { score, label, missing };
}

export async function listProperties(companyId: string) {
  const properties = await prisma.property.findMany({
    where: { companyId },
    include: {
      sop: true,
      sow: true,
      defaultVendor: true,
      _count: {
        select: {
          turnovers: true,
          bookings: true,
          inventory: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return properties.map((p) => ({
    ...p,
    readiness: getTurnoverReadiness(p),
    photoRequirements: parsePhotoRequirements(p.photoRequirementsJson),
    restockDefaults: parseRestockDefaults(p.restockDefaultsJson),
  }));
}

export async function getPropertyDetail(companyId: string, propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId },
    include: {
      sop: true,
      sow: true,
      defaultVendor: true,
      bookings: { orderBy: { checkOut: "desc" }, take: 8 },
      turnovers: {
        include: {
          vendor: true,
          issues: { where: { status: { in: ["OPEN", "ESCALATED", "IN_PROGRESS"] } } },
        },
        orderBy: { windowStart: "desc" },
        take: 8,
      },
      inventory: { orderBy: { name: "asc" }, take: 12 },
    },
  });

  if (!property) return null;

  const openIssues = property.turnovers.flatMap((t) =>
    t.issues.map((issue) => ({
      ...issue,
      turnoverStatus: t.status,
      windowStart: t.windowStart,
    }))
  );

  const [sops, sows, vendors] = await Promise.all([
    prisma.sop.findMany({
      where: { companyId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.sow.findMany({
      where: { companyId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.vendor.findMany({
      where: { companyId, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    property: {
      ...property,
      readiness: getTurnoverReadiness(property),
      photoRequirements: parsePhotoRequirements(property.photoRequirementsJson),
      restockDefaults: parseRestockDefaults(property.restockDefaultsJson),
    },
    openIssues,
    options: { sops, sows, vendors },
  };
}

export function calendarStatusLabel(status: string) {
  switch (status) {
    case "synced":
      return "Synced";
    case "pending":
      return "Pending sync";
    case "error":
      return "Sync error";
    default:
      return "Not connected";
  }
}

export function unitTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
