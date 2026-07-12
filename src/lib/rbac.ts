export const ROLES = [
  "OWNER_OPERATOR",
  "PROPERTY_MANAGER",
  "CLEANING_COORDINATOR",
  "CLEANER",
  "VENDOR",
  "OPS_MANAGER",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER_OPERATOR: "Owner / Operator",
  PROPERTY_MANAGER: "Property Manager",
  CLEANING_COORDINATOR: "Cleaning Coordinator",
  CLEANER: "Cleaner",
  VENDOR: "Vendor / Handyman",
  OPS_MANAGER: "Ops Manager",
};

export type Permission =
  | "dashboard:view"
  | "properties:manage"
  | "turnovers:manage"
  | "turnovers:execute"
  | "sops:manage"
  | "sow:manage"
  | "assignments:manage"
  | "qa:review"
  | "issues:manage"
  | "inventory:manage"
  | "owners:report"
  | "settings:manage"
  | "integrations:manage"
  | "onboarding:run";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER_OPERATOR: [
    "dashboard:view",
    "properties:manage",
    "turnovers:manage",
    "sops:manage",
    "sow:manage",
    "assignments:manage",
    "qa:review",
    "issues:manage",
    "inventory:manage",
    "owners:report",
    "settings:manage",
    "integrations:manage",
    "onboarding:run",
  ],
  PROPERTY_MANAGER: [
    "dashboard:view",
    "properties:manage",
    "turnovers:manage",
    "sops:manage",
    "sow:manage",
    "assignments:manage",
    "qa:review",
    "issues:manage",
    "inventory:manage",
    "owners:report",
    "integrations:manage",
  ],
  CLEANING_COORDINATOR: [
    "dashboard:view",
    "turnovers:manage",
    "assignments:manage",
    "qa:review",
    "issues:manage",
    "inventory:manage",
  ],
  CLEANER: ["dashboard:view", "turnovers:execute", "qa:review", "issues:manage"],
  VENDOR: ["dashboard:view", "issues:manage", "turnovers:execute"],
  OPS_MANAGER: [
    "dashboard:view",
    "properties:manage",
    "turnovers:manage",
    "sops:manage",
    "sow:manage",
    "assignments:manage",
    "qa:review",
    "issues:manage",
    "inventory:manage",
    "owners:report",
    "settings:manage",
    "integrations:manage",
    "onboarding:run",
  ],
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function can(role: string, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: string, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}

export function permissionsFor(role: string): Permission[] {
  if (!isRole(role)) return [];
  return ROLE_PERMISSIONS[role];
}
