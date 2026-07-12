import type { Role } from "./types";

export const ROLE_LABELS: Record<Role, string> = {
  OWNER_OPERATOR: "Owner / Operator",
  PROPERTY_MANAGER: "Property Manager",
  CLEANING_COORDINATOR: "Cleaning Coordinator",
  CLEANER: "Cleaner",
  VENDOR: "Vendor / Handyman",
  OPS_MANAGER: "Ops Manager",
};

type Permission =
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
  | "agents:approve"
  | "onboarding:run";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
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
    "agents:approve",
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
    "agents:approve",
  ],
  CLEANING_COORDINATOR: [
    "dashboard:view",
    "turnovers:manage",
    "assignments:manage",
    "qa:review",
    "issues:manage",
    "inventory:manage",
    "agents:approve",
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
    "agents:approve",
    "onboarding:run",
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
