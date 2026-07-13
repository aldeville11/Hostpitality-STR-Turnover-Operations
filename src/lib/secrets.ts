import { timingSafeEqual } from "crypto";

/** Constant-time secret comparison to prevent timing attacks. */
export function secretsEqual(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Accept current or previous secret during rotation window. */
export function secretsMatchRotation(
  provided: string,
  current: string,
  previous?: string
): boolean {
  if (secretsEqual(provided, current)) return true;
  if (previous && secretsEqual(provided, previous)) return true;
  return false;
}
