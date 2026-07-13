import { prisma } from "./db";

export class TenantAccessError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "TenantAccessError";
  }
}

/** Generic not-found response — does not reveal foreign record existence. */
export function tenantNotFound(message = "Not found"): never {
  throw new TenantAccessError(message);
}

export async function validatePropertyIds(
  companyId: string,
  propertyIds: string[]
): Promise<string[]> {
  if (!propertyIds.length) return [];
  const owned = await prisma.property.findMany({
    where: { companyId, id: { in: propertyIds } },
    select: { id: true },
  });
  if (owned.length !== propertyIds.length) tenantNotFound();
  return propertyIds;
}

export async function validateSopId(
  companyId: string,
  sopId: string | null | undefined
): Promise<string | null> {
  if (!sopId) return null;
  const sop = await prisma.sop.findFirst({
    where: { id: sopId, companyId },
    select: { id: true },
  });
  if (!sop) tenantNotFound();
  return sopId;
}

export async function validateSowId(
  companyId: string,
  sowId: string | null | undefined
): Promise<string | null> {
  if (!sowId) return null;
  const sow = await prisma.sow.findFirst({
    where: { id: sowId, companyId },
    select: { id: true },
  });
  if (!sow) tenantNotFound();
  return sowId;
}

export async function validateVendorId(
  companyId: string,
  vendorId: string | null | undefined
): Promise<string | null> {
  if (!vendorId) return null;
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    select: { id: true },
  });
  if (!vendor) tenantNotFound();
  return vendorId;
}

export async function validatePropertyId(
  companyId: string,
  propertyId: string | null | undefined
): Promise<string | null> {
  if (!propertyId) return null;
  const property = await prisma.property.findFirst({
    where: { id: propertyId, companyId },
    select: { id: true },
  });
  if (!property) tenantNotFound();
  return propertyId;
}

export async function validateTurnoverId(
  companyId: string,
  turnoverId: string | null | undefined
): Promise<string | null> {
  if (!turnoverId) return null;
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId },
    select: { id: true },
  });
  if (!turnover) tenantNotFound();
  return turnoverId;
}

export async function validateQaInspectionId(
  companyId: string,
  qaInspectionId: string | null | undefined
): Promise<string | null> {
  if (!qaInspectionId) return null;
  const inspection = await prisma.qaInspection.findFirst({
    where: { id: qaInspectionId, companyId },
    select: { id: true },
  });
  if (!inspection) tenantNotFound();
  return qaInspectionId;
}

export async function validateUserId(
  companyId: string,
  userId: string | null | undefined
): Promise<string | null> {
  if (!userId) return null;
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
    select: { id: true },
  });
  if (!user) tenantNotFound();
  return userId;
}

/** Verify entityType/entityId belongs to company before file attach/list. */
export async function validateEntityOwnership(
  companyId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  const type = entityType.trim();
  switch (type) {
    case "Property": {
      await validatePropertyId(companyId, entityId);
      return;
    }
    case "Turnover": {
      await validateTurnoverId(companyId, entityId);
      return;
    }
    case "Issue": {
      const issue = await prisma.issue.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!issue) tenantNotFound();
      return;
    }
    case "QaInspection": {
      await validateQaInspectionId(companyId, entityId);
      return;
    }
    case "Sop": {
      await validateSopId(companyId, entityId);
      return;
    }
    case "Sow": {
      await validateSowId(companyId, entityId);
      return;
    }
    case "Vendor": {
      await validateVendorId(companyId, entityId);
      return;
    }
    case "Integration": {
      const integration = await prisma.integration.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!integration) tenantNotFound();
      return;
    }
    default:
      tenantNotFound("Unsupported entity type");
  }
}
