/**
 * Identity domain types — Sprint 1 (AuthN only).
 * Tenancy fields live on AuthContext as optional placeholders for Sprint 2–3.
 */

export type UserStatus = "invited" | "active" | "deactivated";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  status: UserStatus;
  createdAt: string;
  lastSeenAt: string | null;
};

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export type InviteRecord = {
  id: string;
  email: string;
  invitedByUserId: string | null;
  userId: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
};

/**
 * AuthContext shape for RBAC compatibility (Architecture).
 * organizationId / workspaceId / role / locationScope are populated in Sprint 2–3.
 */
export type AuthContext = {
  userId: string;
  email: string;
  status: UserStatus;
  organizationId: string | null;
  workspaceId: string | null;
  role: string | null;
  locationScope: string[];
  sessionId: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
};
