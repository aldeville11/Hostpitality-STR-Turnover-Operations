"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  DEFAULT_PHOTO_REQUIREMENTS,
  DEFAULT_RESTOCK,
  type PhotoRequirement,
  type RestockDefault,
} from "@/lib/properties";

function revalidatePropertyPaths(id?: string) {
  revalidatePath("/properties");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/properties/${id}`);
}

function parseLinesToPhotos(raw: string): PhotoRequirement[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return DEFAULT_PHOTO_REQUIREMENTS;
  return lines.map((label) => ({ label, required: true }));
}

function parseLinesToRestock(raw: string): RestockDefault[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return DEFAULT_RESTOCK;
  return lines.map((line) => {
    const [name, qty, unit] = line.split("|").map((p) => p.trim());
    return {
      name: name || "Item",
      quantity: Number(qty) || 1,
      unit: unit || "each",
    };
  });
}

export async function createPropertyAction(formData: FormData) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) return { error: "No company" };

  const name = String(formData.get("name") || "").trim();
  const unitCode = String(formData.get("unitCode") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const unitType = String(formData.get("unitType") || "apartment");
  const bedrooms = Number(formData.get("bedrooms") || 1);
  const bathrooms = Number(formData.get("bathrooms") || 1);
  const maxGuests = Number(formData.get("maxGuests") || 2);

  if (!name || !unitCode || !address || !city || !state) {
    return { error: "Name, unit code, address, city, and state are required." };
  }

  const existing = await prisma.property.findUnique({
    where: { companyId_unitCode: { companyId: user.companyId, unitCode } },
  });
  if (existing) return { error: "That unit code already exists." };

  const property = await prisma.property.create({
    data: {
      companyId: user.companyId,
      name,
      unitCode,
      address,
      city,
      state,
      unitType,
      bedrooms,
      bathrooms,
      maxGuests,
      photoRequirementsJson: JSON.stringify(DEFAULT_PHOTO_REQUIREMENTS),
      restockDefaultsJson: JSON.stringify(DEFAULT_RESTOCK),
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.created",
    entityType: "Property",
    entityId: property.id,
  });

  revalidatePropertyPaths(property.id);
  redirect(`/properties/${property.id}`);
}

export async function updatePropertyProfileAction(formData: FormData) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || "");
  const property = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!property) return { error: "Property not found" };

  const name = String(formData.get("name") || "").trim();
  const unitCode = String(formData.get("unitCode") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const unitType = String(formData.get("unitType") || property.unitType);
  const bedrooms = Number(formData.get("bedrooms") || property.bedrooms);
  const bathrooms = Number(formData.get("bathrooms") || property.bathrooms);
  const maxGuests = Number(formData.get("maxGuests") || property.maxGuests);
  const notes = String(formData.get("notes") || "").trim() || null;
  const active = String(formData.get("active") || "true") === "true";

  if (!name || !unitCode || !address || !city || !state) {
    return { error: "Required fields missing." };
  }

  if (unitCode !== property.unitCode) {
    const clash = await prisma.property.findUnique({
      where: { companyId_unitCode: { companyId: user.companyId, unitCode } },
    });
    if (clash) return { error: "That unit code already exists." };
  }

  await prisma.property.update({
    where: { id },
    data: {
      name,
      unitCode,
      address,
      city,
      state,
      unitType,
      bedrooms,
      bathrooms,
      maxGuests,
      notes,
      active,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.updated",
    entityType: "Property",
    entityId: id,
  });

  revalidatePropertyPaths(id);
  return;
}

export async function updatePropertySettingsAction(formData: FormData) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || "");
  const property = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!property) return { error: "Property not found" };

  const sopId = String(formData.get("sopId") || "") || null;
  const sowId = String(formData.get("sowId") || "") || null;
  const defaultVendorId = String(formData.get("defaultVendorId") || "") || null;
  const accessNotes = String(formData.get("accessNotes") || "").trim() || null;
  const turnoverBufferMins = Number(formData.get("turnoverBufferMins") || 60);
  const sameDayTurnover = String(formData.get("sameDayTurnover") || "true") === "true";
  const photoRequirementsJson = JSON.stringify(
    parseLinesToPhotos(String(formData.get("photoRequirements") || ""))
  );
  const restockDefaultsJson = JSON.stringify(
    parseLinesToRestock(String(formData.get("restockDefaults") || ""))
  );

  await prisma.property.update({
    where: { id },
    data: {
      sopId,
      sowId,
      defaultVendorId,
      accessNotes,
      turnoverBufferMins,
      sameDayTurnover,
      photoRequirementsJson,
      restockDefaultsJson,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.settings.updated",
    entityType: "Property",
    entityId: id,
    metadata: { sopId, sowId, defaultVendorId },
  });

  revalidatePropertyPaths(id);
  return;
}

export async function updatePropertyCalendarAction(formData: FormData) {
  const user = await requireUser({ permission: "properties:manage" });
  if (!user.companyId) return { error: "No company" };

  const id = String(formData.get("id") || "");
  const property = await prisma.property.findFirst({
    where: { id, companyId: user.companyId },
  });
  if (!property) return { error: "Property not found" };

  const calendarUrl = String(formData.get("calendarUrl") || "").trim() || null;
  const bookingSource = String(formData.get("bookingSource") || "manual");
  const markSynced = String(formData.get("markSynced") || "") === "true";

  await prisma.property.update({
    where: { id },
    data: {
      calendarUrl,
      bookingSource,
      calendarStatus: markSynced
        ? "synced"
        : calendarUrl
          ? "pending"
          : bookingSource === "manual"
            ? "not_connected"
            : "pending",
      calendarSyncedAt: markSynced ? new Date() : property.calendarSyncedAt,
    },
  });

  await writeAuditLog({
    companyId: user.companyId,
    userId: user.id,
    action: "property.calendar.updated",
    entityType: "Property",
    entityId: id,
    metadata: { bookingSource, hasCalendar: Boolean(calendarUrl), markSynced },
  });

  revalidatePropertyPaths(id);
  return;
}
