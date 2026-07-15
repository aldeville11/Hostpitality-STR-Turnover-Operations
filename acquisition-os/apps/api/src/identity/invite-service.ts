import { AuthError } from "./auth-service.js";
import type { AuthContext } from "./types.js";
import type { PlatformStore } from "../platform/types.js";
import { newId } from "./tokens.js";

/**
 * Invite user stub — creates invited User without Membership.
 * Membership assignment is Sprint 2 tenancy API.
 */
export class InviteService {
  constructor(private readonly store: PlatformStore) {}

  async inviteUser(input: {
    email: string;
    name?: string;
    actor: AuthContext | null;
  }): Promise<{
    inviteId: string;
    userId: string;
    email: string;
    status: "pending";
    userStatus: "invited";
  }> {
    if (!input.actor || input.actor.status !== "active") {
      throw new AuthError("UNAUTHENTICATED", "Authentication required to invite.", 401);
    }

    const email = input.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      throw new AuthError("INVALID_EMAIL", "A valid email is required.", 400);
    }

    const existing = await this.store.findUserByEmail(email);
    if (existing) {
      throw new AuthError("EMAIL_TAKEN", "A user with this email already exists.", 409);
    }

    const now = new Date().toISOString();
    const user = await this.store.createUser({
      id: newId("usr"),
      email,
      name: input.name?.trim() || email.split("@")[0] || "Invited user",
      passwordHash: null,
      status: "invited",
      createdAt: now,
      lastSeenAt: null,
    });

    const invite = await this.store.createInvite({
      id: newId("inv"),
      email,
      invitedByUserId: input.actor.userId,
      userId: user.id,
      status: "pending",
      createdAt: now,
    });

    return {
      inviteId: invite.id,
      userId: user.id,
      email,
      status: "pending",
      userStatus: "invited",
    };
  }
}
