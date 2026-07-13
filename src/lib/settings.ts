import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { writeAuditLog } from "./audit";
import { parseJson } from "./json";
import {
  validatePropertyIds,
  validateSopId,
  validateSowId,
  tenantNotFound,
} from "./tenant";
import {
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLES,
  permissionsFor,
  type Permission,
  type Role,
  isRole,
} from "./rbac";

export const SETTINGS_SECTIONS = [
  "company",
  "branding",
  "properties",
  "users",
  "roles",
  "system",
  "audit",
] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  company: "Company settings",
  branding: "Branding",
  properties: "Property defaults",
  users: "User management",
  roles: "Roles & permissions",
  system: "System settings",
  audit: "Audit & security",
};

export const SETTINGS_SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  company: "Profile, timezone, contacts, notifications, and working hours.",
  branding: "Brand name, accent color, logo, and support identity.",
  properties: "Property-level operational defaults, windows, and SLA preferences.",
  users: "Invite and manage users, roles, and access scopes.",
  roles: "Review role capabilities for dispatcher, cleaner, inspector, manager, and admin.",
  system: "Statuses, categories, SLA thresholds, templates, and feature flags.",
  audit: "Critical changes to settings, permissions, and integrations.",
};

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

/** Admin-facing role personas mapped onto existing RBAC roles. */
export const ROLE_PERSONAS: Array<{
  persona: string;
  role: Role;
  description: string;
}> = [
  {
    persona: "Admin",
    role: "OWNER_OPERATOR",
    description: "Full platform control including settings and onboarding.",
  },
  {
    persona: "Ops admin",
    role: "OPS_MANAGER",
    description: "Operational admin with settings, integrations, and reporting.",
  },
  {
    persona: "Manager",
    role: "PROPERTY_MANAGER",
    description: "Property, turnover, SOP/SOW, QA, and reporting access.",
  },
  {
    persona: "Dispatcher",
    role: "CLEANING_COORDINATOR",
    description: "Assignment, turnover coordination, QA, and issues.",
  },
  {
    persona: "Inspector",
    role: "PROPERTY_MANAGER",
    description: "QA review and issue tracking (uses manager role with QA focus).",
  },
  {
    persona: "Cleaner",
    role: "CLEANER",
    description: "Execute turnovers, contribute to QA, and manage field issues.",
  },
];

export type NotificationPrefs = {
  emailAssignments: boolean;
  emailQaOutcomes: boolean;
  emailIssueUpdates: boolean;
  smsUrgentOnly: boolean;
  digestDaily: boolean;
};

export type WorkingHours = {
  timezone: string;
  days: string[];
  start: string;
  end: string;
};

export type SystemSettings = {
  issueCategories: string[];
  issueSeverities: string[];
  turnoverStatuses: string[];
  slaHoursBySeverity: Record<string, number>;
  defaultTurnoverBufferMins: number;
  defaultSlaMinutes: number;
  featureFlags: Record<string, boolean>;
  defaultSopId: string | null;
  defaultSowId: string | null;
};

export type AccessScope = {
  allProperties: boolean;
  propertyIds: string[];
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailAssignments: true,
  emailQaOutcomes: true,
  emailIssueUpdates: true,
  smsUrgentOnly: true,
  digestDaily: false,
};

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  timezone: "America/Los_Angeles",
  days: ["mon", "tue", "wed", "thu", "fri", "sat"],
  start: "08:00",
  end: "18:00",
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  issueCategories: ["damage", "missing", "qa", "access", "clean_miss", "restock", "other"],
  issueSeverities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  turnoverStatuses: [
    "DRAFT",
    "SCHEDULED",
    "ASSIGNED",
    "IN_PROGRESS",
    "READY_FOR_QA",
    "NEEDS_REWORK",
    "COMPLETED",
    "BLOCKED",
    "OVERDUE",
    "CANCELLED",
  ],
  slaHoursBySeverity: { CRITICAL: 4, HIGH: 12, MEDIUM: 24, LOW: 48 },
  defaultTurnoverBufferMins: 60,
  defaultSlaMinutes: 240,
  featureFlags: {
    calendarSync: true,
    messagingHooks: true,
    reportingExports: true,
    integrations: true,
    ownerSummaries: false,
  },
  defaultSopId: null,
  defaultSowId: null,
};

export function parseNotificationPrefs(json: string | null | undefined): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...parseJson<Partial<NotificationPrefs>>(json, {}) };
}

export function parseWorkingHours(json: string | null | undefined): WorkingHours {
  return { ...DEFAULT_WORKING_HOURS, ...parseJson<Partial<WorkingHours>>(json, {}) };
}

export function parseSystemSettings(json: string | null | undefined): SystemSettings {
  const raw = parseJson<Partial<SystemSettings>>(json, {});
  return {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...raw,
    slaHoursBySeverity: {
      ...DEFAULT_SYSTEM_SETTINGS.slaHoursBySeverity,
      ...(raw.slaHoursBySeverity ?? {}),
    },
    featureFlags: {
      ...DEFAULT_SYSTEM_SETTINGS.featureFlags,
      ...(raw.featureFlags ?? {}),
    },
  };
}

export function parseAccessScope(json: string | null | undefined): AccessScope {
  const raw = parseJson<Partial<AccessScope>>(json, {});
  return {
    allProperties: raw.allProperties ?? true,
    propertyIds: raw.propertyIds ?? [],
  };
}

export async function getSettingsOverview(companyId: string) {
  const [company, users, properties, auditCount, integrations] = await Promise.all([
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
    prisma.user.count({ where: { companyId } }),
    prisma.property.count({ where: { companyId, active: true } }),
    prisma.auditLog.count({
      where: {
        companyId,
        OR: [
          { action: { startsWith: "settings." } },
          { action: { startsWith: "user." } },
          { action: { startsWith: "integration." } },
        ],
      },
    }),
    prisma.integration.count({
      where: { companyId, status: "CONNECTED", enabled: true },
    }),
  ]);

  return {
    company: {
      ...company,
      notificationPrefs: parseNotificationPrefs(company.notificationPrefsJson),
      workingHours: parseWorkingHours(company.workingHoursJson),
      systemSettings: parseSystemSettings(company.systemSettingsJson),
    },
    counts: {
      users,
      properties,
      auditCount,
      integrations,
    },
  };
}

export async function getCompanySettings(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  return {
    ...company,
    notificationPrefs: parseNotificationPrefs(company.notificationPrefsJson),
    workingHours: parseWorkingHours(company.workingHoursJson),
    systemSettings: parseSystemSettings(company.systemSettingsJson),
  };
}

export async function updateCompanyProfile(input: {
  companyId: string;
  userId: string;
  name: string;
  timezone: string;
  contactName?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}) {
  const updated = await prisma.company.update({
    where: { id: input.companyId },
    data: {
      name: input.name.trim(),
      timezone: input.timezone.trim() || "America/Los_Angeles",
      contactName: input.contactName?.trim() || null,
      supportEmail: input.supportEmail?.trim() || null,
      supportPhone: input.supportPhone?.trim() || null,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.company.updated",
    entityType: "Company",
    entityId: input.companyId,
    metadata: {
      name: updated.name,
      timezone: updated.timezone,
      contactName: updated.contactName,
    },
  });

  return updated;
}

export async function updateNotificationAndHours(input: {
  companyId: string;
  userId: string;
  notificationPrefs: NotificationPrefs;
  workingHours: WorkingHours;
}) {
  const updated = await prisma.company.update({
    where: { id: input.companyId },
    data: {
      notificationPrefsJson: JSON.stringify(input.notificationPrefs),
      workingHoursJson: JSON.stringify(input.workingHours),
      timezone: input.workingHours.timezone || undefined,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.notifications.updated",
    entityType: "Company",
    entityId: input.companyId,
    metadata: {
      notificationPrefs: input.notificationPrefs,
      workingHours: input.workingHours,
    },
  });

  return updated;
}

export async function updateBranding(input: {
  companyId: string;
  userId: string;
  brandName?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
}) {
  const accent = (input.accentColor || "#0F766E").trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(accent)) {
    throw new Error("Accent color must be a hex value like #0F766E");
  }

  const updated = await prisma.company.update({
    where: { id: input.companyId },
    data: {
      brandName: input.brandName?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
      accentColor: accent,
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.branding.updated",
    entityType: "Company",
    entityId: input.companyId,
    metadata: {
      brandName: updated.brandName,
      logoUrl: updated.logoUrl,
      accentColor: updated.accentColor,
    },
  });

  return updated;
}

export async function listSettingsProperties(companyId: string) {
  return prisma.property.findMany({
    where: { companyId },
    include: {
      sop: { select: { id: true, name: true } },
      sow: { select: { id: true, name: true, slaMinutes: true } },
      defaultVendor: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function updatePropertyAdminDefaults(input: {
  companyId: string;
  userId: string;
  propertyId: string;
  accessNotes?: string | null;
  turnoverBufferMins: number;
  sameDayTurnover: boolean;
  slaMinutes?: number | null;
  active: boolean;
}) {
  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, companyId: input.companyId },
    include: { sow: true },
  });
  if (!property) throw new Error("Property not found");

  const updated = await prisma.property.update({
    where: { id: property.id },
    data: {
      accessNotes: input.accessNotes?.trim() || null,
      turnoverBufferMins: Math.max(0, input.turnoverBufferMins),
      sameDayTurnover: input.sameDayTurnover,
      active: input.active,
    },
  });

  if (input.slaMinutes != null && property.sowId) {
    const sow = await prisma.sow.findFirst({
      where: { id: property.sowId, companyId: input.companyId },
    });
    if (!sow) tenantNotFound();
    await prisma.sow.update({
      where: { id: sow.id },
      data: {
        slaMinutes: Math.max(30, input.slaMinutes),
        completionDeadlineMinutes: Math.max(30, input.slaMinutes),
      },
    });
  }

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.property.updated",
    entityType: "Property",
    entityId: property.id,
    metadata: {
      turnoverBufferMins: updated.turnoverBufferMins,
      sameDayTurnover: updated.sameDayTurnover,
      active: updated.active,
      slaMinutes: input.slaMinutes ?? null,
    },
  });

  return updated;
}

export async function listCompanyUsers(companyId: string) {
  const users = await prisma.user.findMany({
    where: { companyId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return users.map((u) => ({
    ...u,
    accessScope: parseAccessScope(u.accessScopeJson),
    roleLabel: ROLE_LABELS[u.role as Role] ?? u.role,
    permissions: permissionsFor(u.role),
  }));
}

export async function createCompanyUser(input: {
  companyId: string;
  actorUserId: string;
  name: string;
  email: string;
  role: string;
  password: string;
  allProperties?: boolean;
  propertyIds?: string[];
}) {
  if (!isRole(input.role)) throw new Error("Invalid role");
  const email = input.email.toLowerCase().trim();
  if (!email || !input.name.trim()) throw new Error("Name and email are required");
  if (input.password.trim().length < 8) throw new Error("Password must be at least 8 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const propertyIds = input.allProperties
    ? []
    : await validatePropertyIds(input.companyId, input.propertyIds ?? []);

  const accessScope: AccessScope = {
    allProperties: input.allProperties ?? true,
    propertyIds,
  };

  const user = await prisma.user.create({
    data: {
      companyId: input.companyId,
      name: input.name.trim(),
      email,
      role: input.role,
      passwordHash,
      active: true,
      accessScopeJson: JSON.stringify(accessScope),
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.actorUserId,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    metadata: { email, role: user.role, accessScope },
  });

  return user;
}

export async function updateCompanyUser(input: {
  companyId: string;
  actorUserId: string;
  userId: string;
  name: string;
  role: string;
  active: boolean;
  allProperties?: boolean;
  propertyIds?: string[];
}) {
  if (!isRole(input.role)) throw new Error("Invalid role");
  const target = await prisma.user.findFirst({
    where: { id: input.userId, companyId: input.companyId },
  });
  if (!target) throw new Error("User not found");

  // Prevent locking yourself out of settings
  if (target.id === input.actorUserId && !input.active) {
    throw new Error("You cannot deactivate your own account");
  }
  if (
    target.id === input.actorUserId &&
    !permissionsFor(input.role).includes("settings:manage")
  ) {
    throw new Error("You cannot remove your own settings access");
  }

  const propertyIds = input.allProperties
    ? []
    : await validatePropertyIds(input.companyId, input.propertyIds ?? []);

  const accessScope: AccessScope = {
    allProperties: input.allProperties ?? true,
    propertyIds,
  };

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      name: input.name.trim(),
      role: input.role,
      active: input.active,
      accessScopeJson: JSON.stringify(accessScope),
    },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.actorUserId,
    action: "user.updated",
    entityType: "User",
    entityId: updated.id,
    metadata: {
      fromRole: target.role,
      toRole: updated.role,
      active: updated.active,
      accessScope,
    },
  });

  return updated;
}

export function getRolePermissionsMatrix() {
  return ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    permissions: ROLE_PERMISSIONS[role] as Permission[],
    persona:
      ROLE_PERSONAS.find((p) => p.role === role && p.persona !== "Inspector")?.persona ??
      ROLE_LABELS[role],
  }));
}

export async function getSystemSettingsData(companyId: string) {
  const [company, sops, sows] = await Promise.all([
    getCompanySettings(companyId),
    prisma.sop.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.sow.findMany({
      where: { companyId, active: true },
      select: { id: true, name: true, status: true, slaMinutes: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { company, sops, sows };
}

export async function updateSystemSettings(input: {
  companyId: string;
  userId: string;
  systemSettings: SystemSettings;
}) {
  const settings: SystemSettings = {
    ...DEFAULT_SYSTEM_SETTINGS,
    ...input.systemSettings,
    defaultSopId: await validateSopId(input.companyId, input.systemSettings.defaultSopId),
    defaultSowId: await validateSowId(input.companyId, input.systemSettings.defaultSowId),
    slaHoursBySeverity: {
      ...DEFAULT_SYSTEM_SETTINGS.slaHoursBySeverity,
      ...input.systemSettings.slaHoursBySeverity,
    },
    featureFlags: {
      ...DEFAULT_SYSTEM_SETTINGS.featureFlags,
      ...input.systemSettings.featureFlags,
    },
    issueCategories: input.systemSettings.issueCategories.length
      ? input.systemSettings.issueCategories
      : DEFAULT_SYSTEM_SETTINGS.issueCategories,
    issueSeverities: input.systemSettings.issueSeverities.length
      ? input.systemSettings.issueSeverities
      : DEFAULT_SYSTEM_SETTINGS.issueSeverities,
  };

  const updated = await prisma.company.update({
    where: { id: input.companyId },
    data: { systemSettingsJson: JSON.stringify(settings) },
  });

  await writeAuditLog({
    companyId: input.companyId,
    userId: input.userId,
    action: "settings.system.updated",
    entityType: "Company",
    entityId: input.companyId,
    metadata: {
      featureFlags: settings.featureFlags,
      defaultTurnoverBufferMins: settings.defaultTurnoverBufferMins,
      defaultSlaMinutes: settings.defaultSlaMinutes,
      defaultSopId: settings.defaultSopId,
      defaultSowId: settings.defaultSowId,
    },
  });

  return updated;
}

export async function listAdminAuditLogs(
  companyId: string,
  filters?: { q?: string; take?: number }
) {
  const take = filters?.take ?? 80;
  const logs = await prisma.auditLog.findMany({
    where: {
      companyId,
      OR: [
        { action: { startsWith: "settings." } },
        { action: { startsWith: "user." } },
        { action: { startsWith: "integration." } },
        { action: { startsWith: "onboarding." } },
        { action: { contains: "permission" } },
      ],
      ...(filters?.q
        ? {
            AND: [
              {
                OR: [
                  { action: { contains: filters.q } },
                  { entityType: { contains: filters.q } },
                  { entityId: { contains: filters.q } },
                  { metadata: { contains: filters.q } },
                ],
              },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return logs.map((log) => ({
    ...log,
    metadata: parseJson<Record<string, unknown>>(log.metadata, {}),
  }));
}

export type SettingsOverview = Awaited<ReturnType<typeof getSettingsOverview>>;
export type CompanySettings = Awaited<ReturnType<typeof getCompanySettings>>;
export type CompanyUserRow = Awaited<ReturnType<typeof listCompanyUsers>>[number];
