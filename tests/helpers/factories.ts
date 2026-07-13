import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export async function createCompany(prisma: PrismaClient, overrides?: Partial<{ name: string; slug: string }>) {
  const slug = overrides?.slug ?? uid("co");
  return prisma.company.create({
    data: {
      name: overrides?.name ?? `Company ${slug}`,
      slug,
      onboardedAt: new Date(),
      onboardingStep: "finish",
      onboardingProgress: JSON.stringify({ finish: "complete" }),
    },
  });
}

export async function createUser(
  prisma: PrismaClient,
  input: { companyId: string; email?: string; role?: string; password?: string; name?: string }
) {
  const email = input.email ?? `${uid("user")}@test.hostpitality.app`;
  const passwordHash = await bcrypt.hash(input.password ?? "testpass1234", 4);
  return prisma.user.create({
    data: {
      companyId: input.companyId,
      email,
      name: input.name ?? "Test User",
      role: input.role ?? "OPS_MANAGER",
      passwordHash,
      active: true,
    },
  });
}

export async function createProperty(prisma: PrismaClient, companyId: string) {
  const code = uid("unit");
  return prisma.property.create({
    data: {
      companyId,
      name: `Property ${code}`,
      unitCode: code,
      address: "1 Test St",
      city: "Testville",
      state: "CA",
    },
  });
}

export async function createVendor(prisma: PrismaClient, companyId: string) {
  const email = `${uid("vendor")}@test.hostpitality.app`;
  return prisma.vendor.create({
    data: { companyId, name: "Test Vendor", email },
  });
}

export async function createSop(prisma: PrismaClient, companyId: string) {
  return prisma.sop.create({
    data: { companyId, name: `SOP ${uid("sop")}`, status: "PUBLISHED", publishedAt: new Date() },
  });
}

export async function createSow(prisma: PrismaClient, companyId: string) {
  return prisma.sow.create({
    data: { companyId, name: `SOW ${uid("sow")}`, status: "ACTIVE", approvedAt: new Date() },
  });
}

export async function createBooking(prisma: PrismaClient, propertyId: string) {
  const now = new Date();
  return prisma.booking.create({
    data: {
      propertyId,
      checkIn: new Date(now.getTime() + 86400000),
      checkOut: new Date(now.getTime() + 2 * 86400000),
      guestName: "Guest",
    },
  });
}

export async function createTurnover(
  prisma: PrismaClient,
  input: { companyId: string; propertyId: string; bookingId?: string }
) {
  const now = new Date();
  return prisma.turnover.create({
    data: {
      companyId: input.companyId,
      propertyId: input.propertyId,
      bookingId: input.bookingId,
      status: "SCHEDULED",
      windowStart: now,
      windowEnd: new Date(now.getTime() + 3600000),
      deadlineAt: new Date(now.getTime() + 7200000),
    },
  });
}

export async function createIssue(
  prisma: PrismaClient,
  input: { companyId: string; propertyId?: string; title?: string }
) {
  return prisma.issue.create({
    data: {
      companyId: input.companyId,
      propertyId: input.propertyId,
      title: input.title ?? "Test issue",
      description: "Test description",
    },
  });
}

export async function createQaInspection(
  prisma: PrismaClient,
  input: { companyId: string; turnoverId: string }
) {
  return prisma.qaInspection.create({
    data: { companyId: input.companyId, turnoverId: input.turnoverId, status: "PENDING" },
  });
}

export async function createInventoryItem(prisma: PrismaClient, companyId: string, propertyId?: string) {
  return prisma.inventoryItem.create({
    data: { companyId, propertyId, name: `Item ${uid("inv")}`, quantity: 10, reorderLevel: 2 },
  });
}

export async function createIntegration(prisma: PrismaClient, companyId: string) {
  const provider = uid("PROVIDER").toUpperCase();
  return prisma.integration.create({
    data: {
      companyId,
      provider,
      category: "STORAGE",
      name: `Integration ${provider}`,
      status: "CONNECTED",
      enabled: true,
    },
  });
}

export async function createBackgroundJob(prisma: PrismaClient, companyId: string, type = "notification.dispatch") {
  return prisma.backgroundJob.create({
    data: {
      companyId,
      type,
      status: "PENDING",
      payloadJson: JSON.stringify({ title: "Test" }),
      runAt: new Date(),
    },
  });
}

export async function createCompanyFixtures(prisma: PrismaClient, label: "A" | "B") {
  const company = await createCompany(prisma, { name: `Company ${label}`, slug: uid(`company-${label.toLowerCase()}`) });
  const user = await createUser(prisma, {
    companyId: company.id,
    email: `manager-${label.toLowerCase()}-${company.id}@test.hostpitality.app`,
  });
  const property = await createProperty(prisma, company.id);
  const vendor = await createVendor(prisma, company.id);
  const sop = await createSop(prisma, company.id);
  const sow = await createSow(prisma, company.id);
  const booking = await createBooking(prisma, property.id);
  const turnover = await createTurnover(prisma, { companyId: company.id, propertyId: property.id, bookingId: booking.id });
  const qa = await createQaInspection(prisma, { companyId: company.id, turnoverId: turnover.id });
  const issue = await createIssue(prisma, { companyId: company.id, propertyId: property.id });
  const inventory = await createInventoryItem(prisma, company.id, property.id);
  const integration = await createIntegration(prisma, company.id);
  const job = await createBackgroundJob(prisma, company.id);
  return { company, user, property, vendor, sop, sow, booking, turnover, qa, issue, inventory, integration, job };
}
