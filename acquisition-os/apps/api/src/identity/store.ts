import type { InviteRecord } from "./types.js";
import type { PlatformStore } from "../platform/types.js";

/** @deprecated Use PlatformStore — retained as identity subset typing. */
export type IdentityStore = Pick<
  PlatformStore,
  | "createUser"
  | "findUserByEmail"
  | "findUserById"
  | "updateUser"
  | "createSession"
  | "findSessionByTokenHash"
  | "revokeSession"
  | "createInvite"
  | "findInviteById"
>;

export type { InviteRecord };
