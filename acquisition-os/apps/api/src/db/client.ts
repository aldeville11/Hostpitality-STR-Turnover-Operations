import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { MIGRATION_001_SPRINT2_TENANCY } from "./migrations/001_sprint2_tenancy.js";

export type SqlResult = { rows: Record<string, unknown>[] };

export interface SqlDb {
  query(sql: string, params?: unknown[]): Promise<SqlResult>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

class PgPoolDb implements SqlDb {
  constructor(private readonly pool: pg.Pool) {}

  async query(sql: string, params: unknown[] = []): Promise<SqlResult> {
    const result = await this.pool.query(sql, params);
    return { rows: result.rows as Record<string, unknown>[] };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PgliteDb implements SqlDb {
  constructor(private readonly db: PGlite) {}

  async query(sql: string, params: unknown[] = []): Promise<SqlResult> {
    const result = await this.db.query(sql, params);
    return { rows: result.rows as Record<string, unknown>[] };
  }

  async exec(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

export function loadMigrationSql(): string {
  return MIGRATION_001_SPRINT2_TENANCY;
}

export async function applyMigrations(db: SqlDb): Promise<void> {
  await db.exec(loadMigrationSql());
}

/** Embedded Postgres for tests / local without DATABASE_URL. */
export async function createPgliteDb(): Promise<SqlDb> {
  const db = new PGlite();
  const wrapped = new PgliteDb(db);
  await applyMigrations(wrapped);
  return wrapped;
}

/** Managed/local Postgres when DATABASE_URL is set. */
export async function createPostgresDb(databaseUrl: string): Promise<SqlDb> {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const wrapped = new PgPoolDb(pool);
  await applyMigrations(wrapped);
  return wrapped;
}

export async function createSqlDb(env: NodeJS.ProcessEnv = process.env): Promise<{
  db: SqlDb;
  kind: "postgres" | "pglite";
}> {
  const url = env.DATABASE_URL?.trim();
  if (url) {
    return { db: await createPostgresDb(url), kind: "postgres" };
  }
  return { db: await createPgliteDb(), kind: "pglite" };
}
