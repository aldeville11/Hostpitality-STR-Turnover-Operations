import { z } from "zod";

/** Shared record schemas for launch validation / diagnostics. */

export const companyProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: z.string().trim().min(1).max(80),
  supportEmail: z.string().email().nullable().optional().or(z.literal("")),
  supportPhone: z.string().max(40).nullable().optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const bookingSchema = z.object({
  propertyId: z.string().min(1),
  externalId: z.string().min(1).nullable().optional(),
  guestName: z.string().max(120).nullable().optional(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  source: z.string().min(1),
  status: z.enum(["CONFIRMED", "CANCELLED", "CHANGED"]).or(z.string().min(1)),
}).refine((b) => b.checkOut.getTime() >= b.checkIn.getTime(), {
  message: "checkOut must be on/after checkIn",
  path: ["checkOut"],
});

export const turnoverSchema = z.object({
  companyId: z.string().min(1),
  propertyId: z.string().min(1),
  status: z.string().min(1),
  priority: z.string().min(1),
  windowStart: z.coerce.date(),
  windowEnd: z.coerce.date(),
  deadlineAt: z.coerce.date(),
}).refine((t) => t.windowEnd.getTime() >= t.windowStart.getTime(), {
  message: "windowEnd must be on/after windowStart",
  path: ["windowEnd"],
});

export const issueSchema = z.object({
  companyId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).or(z.string().min(1)),
  status: z.string().min(1),
  category: z.string().min(1),
});

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1).max(120),
  role: z.string().min(1),
  active: z.boolean(),
});

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  value: unknown
): { ok: true; data: T } | { ok: false; errors: string[] } {
  const parsed = schema.safeParse(value);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`),
  };
}
