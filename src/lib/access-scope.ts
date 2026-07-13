import { z } from "zod";
import { prisma } from "./db";
import { tenantNotFound } from "./tenant";

export const accessScopeSchema = z.object({
  allProperties: z.boolean(),
  propertyIds: z.array(z.string().min(1)).default([]),
});

export type AccessScope = z.infer<typeof accessScopeSchema>;

export const COMPANY_WIDE_SCOPE: AccessScope = {
  allProperties: true,
  propertyIds: [],
};

/**
 * Parse and normalize accessScope.
 * Malformed JSON or empty restricted scopes fail closed to zero properties
 * (never widen to allProperties).
 */
export function parseAccessScope(json: string | null | undefined): AccessScope {
  try {
    const raw = json ? JSON.parse(json) : {};
    const parsed = accessScopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { allProperties: false, propertyIds: [] };
    }
    const scope = parsed.data;
    if (scope.allProperties) {
      return { allProperties: true, propertyIds: [] };
    }
    // Deduplicate; empty restricted list = no property access
    const ids = [...new Set(scope.propertyIds.filter(Boolean))];
    return { allProperties: false, propertyIds: ids };
  } catch {
    return { allProperties: false, propertyIds: [] };
  }
}

/** Prisma where fragment for Property.id / propertyId filters. */
export function propertyScopeWhere(scope: AccessScope): { id?: { in: string[] } } | Record<string, never> {
  if (scope.allProperties) return {};
  return { id: { in: scope.propertyIds } };
}

/** Combine an exact property id with access scope without overwriting id. */
export function scopedPropertyIdWhere(
  scope: AccessScope,
  propertyId: string
): { AND: Array<Record<string, unknown>> } {
  if (scope.allProperties) {
    return { AND: [{ id: propertyId }] };
  }
  return {
    AND: [{ id: propertyId }, { id: { in: scope.propertyIds } }],
  };
}

/** Prisma where fragment when the FK field is named propertyId. */
export function propertyIdScopeWhere(
  scope: AccessScope
): { propertyId?: { in: string[] } } | Record<string, never> {
  if (scope.allProperties) return {};
  return { propertyId: { in: scope.propertyIds } };
}

/**
 * Issues may have null propertyId (company-level). Restricted users only see
 * issues whose propertyId is in scope (null property issues are hidden).
 */
export function issuePropertyScopeWhere(
  scope: AccessScope
): { propertyId?: { in: string[] } } | Record<string, never> {
  if (scope.allProperties) return {};
  return { propertyId: { in: scope.propertyIds } };
}

export function isPropertyInScope(scope: AccessScope, propertyId: string | null | undefined): boolean {
  if (scope.allProperties) return true;
  if (!propertyId) return false;
  return scope.propertyIds.includes(propertyId);
}

export async function assertPropertyInScope(
  scope: AccessScope,
  propertyId: string | null | undefined
): Promise<void> {
  if (!isPropertyInScope(scope, propertyId)) {
    tenantNotFound();
  }
}

export async function assertTurnoverInScope(
  companyId: string,
  scope: AccessScope,
  turnoverId: string
): Promise<{ id: string; propertyId: string }> {
  const turnover = await prisma.turnover.findFirst({
    where: { id: turnoverId, companyId, ...propertyIdScopeWhere(scope) },
    select: { id: true, propertyId: true },
  });
  if (!turnover) tenantNotFound();
  return turnover;
}

export async function assertIssueInScope(
  companyId: string,
  scope: AccessScope,
  issueId: string
): Promise<{ id: string; propertyId: string | null }> {
  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,
      companyId,
      ...(scope.allProperties ? {} : { propertyId: { in: scope.propertyIds } }),
    },
    select: { id: true, propertyId: true },
  });
  if (!issue) tenantNotFound();
  return issue;
}

export async function sanitizeAccessScopeForCompany(
  companyId: string,
  input: { allProperties?: boolean; propertyIds?: string[] }
): Promise<AccessScope> {
  if (input.allProperties ?? true) {
    return COMPANY_WIDE_SCOPE;
  }
  const requested = [...new Set((input.propertyIds ?? []).filter(Boolean))];
  if (requested.length === 0) {
    return { allProperties: false, propertyIds: [] };
  }
  const owned = await prisma.property.findMany({
    where: { companyId, id: { in: requested } },
    select: { id: true },
  });
  if (owned.length !== requested.length) {
    tenantNotFound();
  }
  return { allProperties: false, propertyIds: requested };
}
