import { PrismaClient } from "@prisma/client";

const FORBIDDEN_MARKERS = ["production", "staging", "prod", "live"];

export function assertTestDatabase(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes("sqlite") || lower.startsWith("file:")) {
    throw new Error("Tests must not use SQLite");
  }
  for (const marker of FORBIDDEN_MARKERS) {
    if (lower.includes(marker)) {
      throw new Error(`Refusing test database URL containing '${marker}'`);
    }
  }
}

export function createTestPrisma() {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  assertTestDatabase(url);
  return new PrismaClient({ datasources: { db: { url } } });
}

const ROLLBACK = Symbol("rollback");

export async function runInTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      const result = await fn(tx as PrismaClient);
      throw { [ROLLBACK]: true, result };
    });
  } catch (err) {
    if (err && typeof err === "object" && ROLLBACK in err) {
      return (err as unknown as { result: T }).result;
    }
    throw err;
  }
}
