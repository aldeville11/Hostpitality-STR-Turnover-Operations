import type { InviteRecord, SessionRecord, UserRecord } from "./types.js";

/**
 * Persistence port for Identity (Sprint 1).
 * Production target: Postgres (Architecture). Memory store is CI/local only.
 */
export interface IdentityStore {
  createUser(user: UserRecord): Promise<UserRecord>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  updateUser(user: UserRecord): Promise<UserRecord>;

  createSession(session: SessionRecord): Promise<SessionRecord>;
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  revokeSession(sessionId: string, revokedAt: string): Promise<void>;

  createInvite(invite: InviteRecord): Promise<InviteRecord>;
  findInviteById(id: string): Promise<InviteRecord | null>;
}

export class MemoryIdentityStore implements IdentityStore {
  private usersById = new Map<string, UserRecord>();
  private usersByEmail = new Map<string, string>();
  private sessionsById = new Map<string, SessionRecord>();
  private sessionsByHash = new Map<string, string>();
  private invitesById = new Map<string, InviteRecord>();

  async createUser(user: UserRecord): Promise<UserRecord> {
    if (this.usersByEmail.has(user.email.toLowerCase())) {
      throw new Error("EMAIL_TAKEN");
    }
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const id = this.usersByEmail.get(email.toLowerCase());
    if (!id) return null;
    return this.usersById.get(id) ?? null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    return this.usersById.get(id) ?? null;
  }

  async updateUser(user: UserRecord): Promise<UserRecord> {
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email.toLowerCase(), user.id);
    return user;
  }

  async createSession(session: SessionRecord): Promise<SessionRecord> {
    this.sessionsById.set(session.id, session);
    this.sessionsByHash.set(session.tokenHash, session.id);
    return session;
  }

  async findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const id = this.sessionsByHash.get(tokenHash);
    if (!id) return null;
    return this.sessionsById.get(id) ?? null;
  }

  async revokeSession(sessionId: string, revokedAt: string): Promise<void> {
    const session = this.sessionsById.get(sessionId);
    if (!session) return;
    const next = { ...session, revokedAt };
    this.sessionsById.set(sessionId, next);
  }

  async createInvite(invite: InviteRecord): Promise<InviteRecord> {
    this.invitesById.set(invite.id, invite);
    return invite;
  }

  async findInviteById(id: string): Promise<InviteRecord | null> {
    return this.invitesById.get(id) ?? null;
  }
}
