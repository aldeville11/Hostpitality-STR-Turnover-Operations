import type { InviteRecord, SessionRecord, UserRecord } from "../identity/types.js";
import type { ConstitutionRoleKey } from "../identity/rbac.js";

export type OrgType = "independent" | "multi_location" | "franchise" | "pe_portfolio" | "partner";
export type OrgStatus = "prospect" | "active" | "suspended" | "churned";
export type LocationStatus = "setup" | "live" | "paused" | "closed";
export type WorkspaceStatus = "provisioning" | "active" | "locked";
export type MembershipStatus = "invited" | "active" | "revoked";

export type OrganizationRecord = {
  id: string;
  name: string;
  legalName: string;
  type: OrgType;
  billingEntity: string | null;
  status: OrgStatus;
  createdAt: string;
};

export type LocationRecord = {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  address: string | null;
  phone: string | null;
  gbpLink: string | null;
  status: LocationStatus;
  createdAt: string;
};

export type WorkspaceRecord = {
  id: string;
  organizationId: string;
  name: string;
  locationIds: string[];
  planTier: string;
  settings: Record<string, unknown>;
  status: WorkspaceStatus;
  createdAt: string;
};

export type MembershipRecord = {
  id: string;
  userId: string;
  workspaceId: string;
  organizationId: string;
  roleKey: ConstitutionRoleKey | string;
  locationScope: string[];
  status: MembershipStatus;
  createdAt: string;
};

export type DomainEventRecord = {
  id: string;
  type: string;
  organizationId: string | null;
  workspaceId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

/**
 * Tenant context required for all tenancy repository reads/writes.
 * Organization id is the hard tenant boundary (Constitution).
 */
export type TenantContext = {
  organizationId: string;
};

export type IdentityMethods = {
  createUser(user: UserRecord): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  updateUser(user: UserRecord): Promise<UserRecord>;
  createSession(session: SessionRecord): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  revokeSession(sessionId: string, revokedAt: string): Promise<void>;
  createInvite(invite: InviteRecord): Promise<InviteRecord>;
  findInviteById(id: string): Promise<InviteRecord | null>;
};

export type TenancyMethods = {
  createOrganization(org: OrganizationRecord): Promise<OrganizationRecord>;
  getOrganization(id: string): Promise<OrganizationRecord | null>;
  listOrganizations(): Promise<OrganizationRecord[]>;

  createLocation(tenant: TenantContext, location: LocationRecord): Promise<LocationRecord>;
  getLocation(tenant: TenantContext, locationId: string): Promise<LocationRecord | null>;
  listLocations(tenant: TenantContext): Promise<LocationRecord[]>;

  createWorkspace(tenant: TenantContext, workspace: WorkspaceRecord): Promise<WorkspaceRecord>;
  getWorkspace(tenant: TenantContext, workspaceId: string): Promise<WorkspaceRecord | null>;
  listWorkspaces(tenant: TenantContext): Promise<WorkspaceRecord[]>;

  assignMembership(tenant: TenantContext, membership: MembershipRecord): Promise<MembershipRecord>;
  getMembership(tenant: TenantContext, membershipId: string): Promise<MembershipRecord | null>;
  listMemberships(tenant: TenantContext, workspaceId?: string): Promise<MembershipRecord[]>;
  revokeMembership(tenant: TenantContext, membershipId: string, revokedAt: string): Promise<MembershipRecord>;

  /** Active membership for AuthContext population (no RBAC). */
  findActiveMembershipForUser(userId: string): Promise<MembershipRecord | null>;

  appendDomainEvent(event: DomainEventRecord): Promise<DomainEventRecord>;
  listDomainEvents(tenant: TenantContext): Promise<DomainEventRecord[]>;
  listDomainEventsByType(type: string): Promise<DomainEventRecord[]>;
};

export type PlatformStore = IdentityMethods & TenancyMethods;
