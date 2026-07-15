import type { InviteRecord, SessionRecord, UserRecord } from "../identity/types.js";
import type { SqlDb } from "../db/client.js";
import type {
  DomainEventRecord,
  LocationRecord,
  MembershipRecord,
  OrganizationRecord,
  PlatformStore,
  TenantContext,
  WorkspaceRecord,
} from "./types.js";

function requireTenant(tenant: TenantContext, organizationId: string, resource: string): void {
  if (tenant.organizationId !== organizationId) {
    throw new TenantIsolationError(`${resource} belongs to a different organization.`);
  }
}

export class TenantIsolationError extends Error {
  readonly code = "TENANT_ISOLATION";
  constructor(message: string) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

export class SqlPlatformStore implements PlatformStore {
  constructor(private readonly db: SqlDb) {}

  async createUser(user: UserRecord): Promise<UserRecord> {
    try {
      await this.db.query(
        `INSERT INTO users (id, email, name, password_hash, status, created_at, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          user.id,
          user.email.toLowerCase(),
          user.name,
          user.passwordHash,
          user.status,
          user.createdAt,
          user.lastSeenAt,
        ]
      );
    } catch (err) {
      const msg = String(err);
      if (msg.includes("unique") || msg.includes("UNIQUE")) throw new Error("EMAIL_TAKEN");
      throw err;
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM users WHERE email = $1`, [
      email.toLowerCase(),
    ]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async updateUser(user: UserRecord): Promise<UserRecord> {
    await this.db.query(
      `UPDATE users SET email=$2, name=$3, password_hash=$4, status=$5, last_seen_at=$6 WHERE id=$1`,
      [user.id, user.email.toLowerCase(), user.name, user.passwordHash, user.status, user.lastSeenAt]
    );
    return user;
  }

  async createSession(session: SessionRecord): Promise<SessionRecord> {
    await this.db.query(
      `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, revoked_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        session.id,
        session.userId,
        session.tokenHash,
        session.expiresAt,
        session.createdAt,
        session.revokedAt,
      ]
    );
    return session;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM sessions WHERE token_hash = $1`, [
      tokenHash,
    ]);
    return rows[0] ? mapSession(rows[0]) : null;
  }

  async revokeSession(sessionId: string, revokedAt: string): Promise<void> {
    await this.db.query(`UPDATE sessions SET revoked_at = $2 WHERE id = $1`, [
      sessionId,
      revokedAt,
    ]);
  }

  async createInvite(invite: InviteRecord): Promise<InviteRecord> {
    await this.db.query(
      `INSERT INTO invites (id, email, invited_by_user_id, user_id, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        invite.id,
        invite.email.toLowerCase(),
        invite.invitedByUserId,
        invite.userId,
        invite.status,
        invite.createdAt,
      ]
    );
    return invite;
  }

  async findInviteById(id: string): Promise<InviteRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM invites WHERE id = $1`, [id]);
    return rows[0] ? mapInvite(rows[0]) : null;
  }

  async createOrganization(org: OrganizationRecord): Promise<OrganizationRecord> {
    await this.db.query(
      `INSERT INTO organizations (id, name, legal_name, type, billing_entity, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [org.id, org.name, org.legalName, org.type, org.billingEntity, org.status, org.createdAt]
    );
    return org;
  }

  async getOrganization(id: string): Promise<OrganizationRecord | null> {
    const { rows } = await this.db.query(`SELECT * FROM organizations WHERE id = $1`, [id]);
    return rows[0] ? mapOrg(rows[0]) : null;
  }

  async listOrganizations(): Promise<OrganizationRecord[]> {
    const { rows } = await this.db.query(`SELECT * FROM organizations ORDER BY created_at`);
    return rows.map(mapOrg);
  }

  async createLocation(tenant: TenantContext, location: LocationRecord): Promise<LocationRecord> {
    requireTenant(tenant, location.organizationId, "Location");
    const org = await this.getOrganization(tenant.organizationId);
    if (!org) throw new TenantIsolationError("Organization not found for tenant context.");
    await this.db.query(
      `INSERT INTO locations (id, organization_id, name, timezone, address, phone, gbp_link, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        location.id,
        location.organizationId,
        location.name,
        location.timezone,
        location.address,
        location.phone,
        location.gbpLink,
        location.status,
        location.createdAt,
      ]
    );
    return location;
  }

  async getLocation(tenant: TenantContext, locationId: string): Promise<LocationRecord | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM locations WHERE id = $1 AND organization_id = $2`,
      [locationId, tenant.organizationId]
    );
    return rows[0] ? mapLocation(rows[0]) : null;
  }

  async listLocations(tenant: TenantContext): Promise<LocationRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM locations WHERE organization_id = $1 ORDER BY created_at`,
      [tenant.organizationId]
    );
    return rows.map(mapLocation);
  }

  async createWorkspace(tenant: TenantContext, workspace: WorkspaceRecord): Promise<WorkspaceRecord> {
    requireTenant(tenant, workspace.organizationId, "Workspace");
    if (workspace.locationIds.length === 0) {
      throw new Error("WORKSPACE_REQUIRES_LOCATION");
    }
    for (const locId of workspace.locationIds) {
      const loc = await this.getLocation(tenant, locId);
      if (!loc) throw new TenantIsolationError("Location not in tenant organization.");
    }
    await this.db.query(
      `INSERT INTO workspaces (id, organization_id, name, plan_tier, settings_json, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        workspace.id,
        workspace.organizationId,
        workspace.name,
        workspace.planTier,
        JSON.stringify(workspace.settings),
        workspace.status,
        workspace.createdAt,
      ]
    );
    for (const locId of workspace.locationIds) {
      await this.db.query(
        `INSERT INTO workspace_locations (workspace_id, location_id, organization_id) VALUES ($1,$2,$3)`,
        [workspace.id, locId, tenant.organizationId]
      );
    }
    return workspace;
  }

  async getWorkspace(tenant: TenantContext, workspaceId: string): Promise<WorkspaceRecord | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM workspaces WHERE id = $1 AND organization_id = $2`,
      [workspaceId, tenant.organizationId]
    );
    if (!rows[0]) return null;
    const locs = await this.db.query(
      `SELECT location_id FROM workspace_locations WHERE workspace_id = $1 AND organization_id = $2`,
      [workspaceId, tenant.organizationId]
    );
    return mapWorkspace(rows[0], locs.rows.map((r) => String(r.location_id)));
  }

  async listWorkspaces(tenant: TenantContext): Promise<WorkspaceRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM workspaces WHERE organization_id = $1 ORDER BY created_at`,
      [tenant.organizationId]
    );
    const out: WorkspaceRecord[] = [];
    for (const row of rows) {
      const ws = await this.getWorkspace(tenant, String(row.id));
      if (ws) out.push(ws);
    }
    return out;
  }

  async assignMembership(
    tenant: TenantContext,
    membership: MembershipRecord
  ): Promise<MembershipRecord> {
    requireTenant(tenant, membership.organizationId, "Membership");
    const workspace = await this.getWorkspace(tenant, membership.workspaceId);
    if (!workspace) throw new TenantIsolationError("Workspace not in tenant organization.");
    if (workspace.organizationId !== tenant.organizationId) {
      throw new TenantIsolationError("Membership cannot cross tenants.");
    }
    for (const locId of membership.locationScope) {
      const loc = await this.getLocation(tenant, locId);
      if (!loc) throw new TenantIsolationError("location_scope includes foreign location.");
      if (!workspace.locationIds.includes(locId)) {
        throw new TenantIsolationError("location_scope must be within workspace locations.");
      }
    }
    const user = await this.findUserById(membership.userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    try {
      await this.db.query(
        `INSERT INTO memberships (id, user_id, workspace_id, organization_id, role_key, location_scope_json, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          membership.id,
          membership.userId,
          membership.workspaceId,
          membership.organizationId,
          membership.roleKey,
          JSON.stringify(membership.locationScope),
          membership.status,
          membership.createdAt,
        ]
      );
    } catch (err) {
      const msg = String(err);
      if (msg.includes("unique") || msg.includes("UNIQUE")) throw new Error("MEMBERSHIP_EXISTS");
      throw err;
    }
    return membership;
  }

  async getMembership(tenant: TenantContext, membershipId: string): Promise<MembershipRecord | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM memberships WHERE id = $1 AND organization_id = $2`,
      [membershipId, tenant.organizationId]
    );
    return rows[0] ? mapMembership(rows[0]) : null;
  }

  async listMemberships(tenant: TenantContext, workspaceId?: string): Promise<MembershipRecord[]> {
    if (workspaceId) {
      const { rows } = await this.db.query(
        `SELECT * FROM memberships WHERE organization_id = $1 AND workspace_id = $2 ORDER BY created_at`,
        [tenant.organizationId, workspaceId]
      );
      return rows.map(mapMembership);
    }
    const { rows } = await this.db.query(
      `SELECT * FROM memberships WHERE organization_id = $1 ORDER BY created_at`,
      [tenant.organizationId]
    );
    return rows.map(mapMembership);
  }

  async revokeMembership(
    tenant: TenantContext,
    membershipId: string,
    _revokedAt: string
  ): Promise<MembershipRecord> {
    const existing = await this.getMembership(tenant, membershipId);
    if (!existing) throw new TenantIsolationError("Membership not found in tenant.");
    await this.db.query(
      `UPDATE memberships SET status = 'revoked' WHERE id = $1 AND organization_id = $2`,
      [membershipId, tenant.organizationId]
    );
    return { ...existing, status: "revoked" };
  }

  async findActiveMembershipForUser(userId: string): Promise<MembershipRecord | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM memberships WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] ? mapMembership(rows[0]) : null;
  }

  async appendDomainEvent(event: DomainEventRecord): Promise<DomainEventRecord> {
    await this.db.query(
      `INSERT INTO domain_events (id, type, organization_id, workspace_id, payload_json, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        event.id,
        event.type,
        event.organizationId,
        event.workspaceId,
        JSON.stringify(event.payload),
        event.createdAt,
      ]
    );
    return event;
  }

  async listDomainEvents(tenant: TenantContext): Promise<DomainEventRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM domain_events WHERE organization_id = $1 ORDER BY created_at`,
      [tenant.organizationId]
    );
    return rows.map(mapEvent);
  }

  async listDomainEventsByType(type: string): Promise<DomainEventRecord[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM domain_events WHERE type = $1 ORDER BY created_at`,
      [type]
    );
    return rows.map(mapEvent);
  }
}

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    passwordHash: row.password_hash == null ? null : String(row.password_hash),
    status: row.status as UserRecord["status"],
    createdAt: iso(row.created_at),
    lastSeenAt: row.last_seen_at == null ? null : iso(row.last_seen_at),
  };
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tokenHash: String(row.token_hash),
    expiresAt: iso(row.expires_at),
    createdAt: iso(row.created_at),
    revokedAt: row.revoked_at == null ? null : iso(row.revoked_at),
  };
}

function mapInvite(row: Record<string, unknown>): InviteRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    invitedByUserId: row.invited_by_user_id == null ? null : String(row.invited_by_user_id),
    userId: String(row.user_id),
    status: row.status as InviteRecord["status"],
    createdAt: iso(row.created_at),
  };
}

function mapOrg(row: Record<string, unknown>): OrganizationRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    legalName: String(row.legal_name),
    type: row.type as OrganizationRecord["type"],
    billingEntity: row.billing_entity == null ? null : String(row.billing_entity),
    status: row.status as OrganizationRecord["status"],
    createdAt: iso(row.created_at),
  };
}

function mapLocation(row: Record<string, unknown>): LocationRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    timezone: String(row.timezone),
    address: row.address == null ? null : String(row.address),
    phone: row.phone == null ? null : String(row.phone),
    gbpLink: row.gbp_link == null ? null : String(row.gbp_link),
    status: row.status as LocationRecord["status"],
    createdAt: iso(row.created_at),
  };
}

function mapWorkspace(row: Record<string, unknown>, locationIds: string[]): WorkspaceRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    name: String(row.name),
    locationIds,
    planTier: String(row.plan_tier),
    settings: JSON.parse(String(row.settings_json || "{}")) as Record<string, unknown>,
    status: row.status as WorkspaceRecord["status"],
    createdAt: iso(row.created_at),
  };
}

function mapMembership(row: Record<string, unknown>): MembershipRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    workspaceId: String(row.workspace_id),
    organizationId: String(row.organization_id),
    roleKey: String(row.role_key),
    locationScope: JSON.parse(String(row.location_scope_json || "[]")) as string[],
    status: row.status as MembershipRecord["status"],
    createdAt: iso(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): DomainEventRecord {
  return {
    id: String(row.id),
    type: String(row.type),
    organizationId: row.organization_id == null ? null : String(row.organization_id),
    workspaceId: row.workspace_id == null ? null : String(row.workspace_id),
    payload: JSON.parse(String(row.payload_json || "{}")) as Record<string, unknown>,
    createdAt: iso(row.created_at),
  };
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
