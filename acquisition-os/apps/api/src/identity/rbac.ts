/**
 * RBAC compatibility hooks — Sprint 1.
 * Full Constitution matrix + deny-by-default middleware lands in Sprint 3.
 * Owner: Security Engineer · Reviewer: Backend Lead
 */

import type { AuthContext } from "./types.js";

/** Constitution v1 role keys (frozen vocabulary) — not enforced until Sprint 3. */
export const CONSTITUTION_ROLE_KEYS = [
  "owner",
  "executive",
  "operations_manager",
  "csr",
  "sales_manager",
  "marketing",
  "read_only",
  "support",
  "administrator",
] as const;

export type ConstitutionRoleKey = (typeof CONSTITUTION_ROLE_KEYS)[number];

export class RbacNotReadyError extends Error {
  readonly code = "RBAC_NOT_READY";
  constructor(message = "RBAC enforcement is not available until Sprint 3.") {
    super(message);
    this.name = "RbacNotReadyError";
  }
}

/**
 * Placeholder for AuthContext assembly after session validation.
 * Tenancy fields remain null until Organization/Workspace Membership (Sprint 2).
 */
export function toAuthContext(input: {
  userId: string;
  email: string;
  status: AuthContext["status"];
  sessionId: string;
}): AuthContext {
  return {
    userId: input.userId,
    email: input.email,
    status: input.status,
    organizationId: null,
    workspaceId: null,
    role: null,
    locationScope: [],
    sessionId: input.sessionId,
  };
}

/**
 * Hook for future permission checks. Sprint 1: throws RbacNotReadyError
 * so callers cannot accidentally treat UI-only checks as authorization.
 */
export function assertPermission(
  _actor: AuthContext,
  _permission: string
): never {
  throw new RbacNotReadyError();
}

export function isAuthenticated(actor: AuthContext | null): actor is AuthContext {
  return actor !== null && actor.status === "active";
}
