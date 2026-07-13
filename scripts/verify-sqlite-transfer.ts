#!/usr/bin/env tsx
/**
 * Disposable SQLite → PostgreSQL transfer verification.
 */
import Database from "better-sqlite3";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SQLITE_PATH = path.join(ROOT, "tmp", "transfer-source.db");
const PG_URL =
  process.env.TRANSFER_TARGET_URL ||
  "postgresql://hostpitality:hostpitality_test@localhost:5432/hostpitality_transfer?schema=public";

function sh(cmd: string, env: Record<string, string> = {}) {
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

function ensureTransferDb() {
  try {
    sh(`sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='hostpitality_transfer' AND pid <> pg_backend_pid();"`);
  } catch {
    /* ignore */
  }
  sh(`sudo -u postgres psql -c "DROP DATABASE IF EXISTS hostpitality_transfer;"`);
  sh(`sudo -u postgres psql -c "CREATE DATABASE hostpitality_transfer OWNER hostpitality;"`);
}

function buildSqliteSource() {
  fs.mkdirSync(path.dirname(SQLITE_PATH), { recursive: true });
  if (fs.existsSync(SQLITE_PATH)) fs.unlinkSync(SQLITE_PATH);
  const db = new Database(SQLITE_PATH);
  const now = Date.now();

  db.exec(`
    CREATE TABLE Company (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      timezone TEXT DEFAULT 'America/Los_Angeles', brandName TEXT, logoUrl TEXT,
      accentColor TEXT DEFAULT '#0F766E', supportEmail TEXT, supportPhone TEXT, contactName TEXT,
      notificationPrefsJson TEXT DEFAULT '{}', workingHoursJson TEXT DEFAULT '{}',
      systemSettingsJson TEXT DEFAULT '{}', onboardedAt INTEGER, onboardingStep TEXT DEFAULT 'finish',
      onboardingProgress TEXT DEFAULT '{}', createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE User (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, passwordHash TEXT NOT NULL, name TEXT NOT NULL,
      role TEXT DEFAULT 'OPS_MANAGER', companyId TEXT, active INTEGER DEFAULT 1,
      accessScopeJson TEXT DEFAULT '{"allProperties":true,"propertyIds":[]}',
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE Session (
      id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, userId TEXT NOT NULL,
      expiresAt INTEGER NOT NULL, createdAt INTEGER NOT NULL
    );
    CREATE TABLE Sop (
      id TEXT PRIMARY KEY, companyId TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
      version INTEGER DEFAULT 1, contentJson TEXT DEFAULT '{}', status TEXT DEFAULT 'PUBLISHED',
      publishedAt INTEGER, templateKey TEXT, unitType TEXT, safetyNotes TEXT, active INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE Sow (
      id TEXT PRIMARY KEY, companyId TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
      standardScope TEXT DEFAULT '', addOnsJson TEXT DEFAULT '[]', contentJson TEXT DEFAULT '{}',
      slaMinutes INTEGER DEFAULT 240, completionDeadlineMinutes INTEGER DEFAULT 240, version INTEGER DEFAULT 1,
      status TEXT DEFAULT 'ACTIVE', unitType TEXT, useCase TEXT, propertyGroup TEXT,
      approvedAt INTEGER, approvedById TEXT, approvedByName TEXT, publishedAt INTEGER, active INTEGER DEFAULT 1,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE Vendor (
      id TEXT PRIMARY KEY, companyId TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
      phone TEXT, type TEXT DEFAULT 'CLEANER', active INTEGER DEFAULT 1, notes TEXT,
      coverageAreasJson TEXT DEFAULT '[]', skillsJson TEXT DEFAULT '[]', capacity INTEGER DEFAULT 3,
      rating REAL DEFAULT 5, availabilityStatus TEXT DEFAULT 'AVAILABLE', unavailableUntil INTEGER,
      unavailableReason TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE Property (
      id TEXT PRIMARY KEY, companyId TEXT NOT NULL, name TEXT NOT NULL, unitCode TEXT NOT NULL,
      address TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, unitType TEXT DEFAULT 'apartment',
      bedrooms INTEGER DEFAULT 1, bathrooms REAL DEFAULT 1, maxGuests INTEGER DEFAULT 2,
      calendarUrl TEXT, bookingSource TEXT DEFAULT 'manual', calendarSyncedAt INTEGER,
      calendarStatus TEXT DEFAULT 'not_connected', sopId TEXT, sowId TEXT, defaultVendorId TEXT,
      photoRequirementsJson TEXT DEFAULT '[]', restockDefaultsJson TEXT DEFAULT '[]', accessNotes TEXT,
      turnoverBufferMins INTEGER DEFAULT 60, sameDayTurnover INTEGER DEFAULT 1, active INTEGER DEFAULT 1,
      notes TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
    CREATE TABLE Turnover (
      id TEXT PRIMARY KEY, companyId TEXT NOT NULL, propertyId TEXT NOT NULL, bookingId TEXT,
      sopId TEXT, sowId TEXT, vendorId TEXT, status TEXT DEFAULT 'SCHEDULED', priority TEXT DEFAULT 'NORMAL',
      windowStart INTEGER NOT NULL, windowEnd INTEGER NOT NULL, deadlineAt INTEGER NOT NULL,
      photosRequired INTEGER DEFAULT 4, photosUploaded INTEGER DEFAULT 0, photosVerified INTEGER DEFAULT 0,
      ownerNotifiedAt INTEGER, escalatedAt INTEGER, notes TEXT,
      createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL
    );
  `);

  db.prepare(
    `INSERT INTO Company (id,name,slug,onboardedAt,onboardingStep,onboardingProgress,createdAt,updatedAt)
     VALUES ('co1','Transfer Co','transfer-co',?,?,?,?,?)`
  ).run(now, "finish", JSON.stringify({ finish: "complete" }), now, now);
  db.prepare(
    `INSERT INTO User (id,email,passwordHash,name,role,companyId,active,accessScopeJson,createdAt,updatedAt)
     VALUES ('u1','transfer@test.hostpitality.app','hash','Transfer User','OPS_MANAGER','co1',1,?,?,?)`
  ).run(JSON.stringify({ allProperties: true, propertyIds: [] }), now, now);
  db.prepare(
    `INSERT INTO Session (id,token,userId,expiresAt,createdAt) VALUES ('s1','raw-legacy-token-must-not-copy','u1',?,?)`
  ).run(now + 86400000, now);
  db.prepare(
    `INSERT INTO Sop (id,companyId,name,status,publishedAt,createdAt,updatedAt) VALUES ('sop1','co1','SOP','PUBLISHED',?,?,?)`
  ).run(now, now, now);
  db.prepare(
    `INSERT INTO Sow (id,companyId,name,status,approvedAt,createdAt,updatedAt) VALUES ('sow1','co1','SOW','ACTIVE',?,?,?)`
  ).run(now, now, now);
  db.prepare(
    `INSERT INTO Vendor (id,companyId,name,email,createdAt,updatedAt) VALUES ('v1','co1','Vendor','v@test.hostpitality.app',?,?)`
  ).run(now, now);
  db.prepare(
    `INSERT INTO Property (id,companyId,name,unitCode,address,city,state,sopId,sowId,createdAt,updatedAt)
     VALUES ('p1','co1','Prop','T-01','1 St','Town','CA','sop1','sow1',?,?)`
  ).run(now, now);
  db.prepare(
    `INSERT INTO Turnover (id,companyId,propertyId,status,windowStart,windowEnd,deadlineAt,createdAt,updatedAt)
     VALUES ('t1','co1','p1','SCHEDULED',?,?,?,?,?)`
  ).run(now, now + 3600000, now + 7200000, now, now);
  db.close();
}

async function main() {
  process.env.DATABASE_URL = PG_URL;
  buildSqliteSource();
  ensureTransferDb();
  sh(`npx prisma migrate deploy`, { DATABASE_URL: PG_URL });

  let refusedUnsafeTarget = false;
  try {
    execSync(
      `npx tsx scripts/sqlite-to-postgres.ts --source file:${SQLITE_PATH} --target postgresql://u:p@prod-db.example:5432/hostpitality`,
      { stdio: "pipe" }
    );
  } catch {
    refusedUnsafeTarget = true;
  }
  if (!refusedUnsafeTarget) throw new Error("Expected production-like target refusal");

  let refusedAmbiguousTarget = false;
  try {
    execSync(`npx tsx scripts/sqlite-to-postgres.ts --target ${PG_URL}`, { stdio: "pipe" });
  } catch {
    refusedAmbiguousTarget = true;
  }
  if (!refusedAmbiguousTarget) throw new Error("Expected missing --source refusal");

  sh(`npx tsx scripts/sqlite-to-postgres.ts --source file:${SQLITE_PATH} --target ${PG_URL}`);

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: PG_URL } } });
  const company = await prisma.company.findUniqueOrThrow({ where: { id: "co1" } });
  const property = await prisma.property.findUniqueOrThrow({ where: { id: "p1" } });
  const turnover = await prisma.turnover.findUniqueOrThrow({ where: { id: "t1" } });
  const sessions = await prisma.session.count();
  if (property.companyId !== company.id) throw new Error("company relationship broken");
  if (turnover.propertyId !== property.id) throw new Error("turnover FK broken");
  if (sessions !== 0) throw new Error("Sessions must not be transferred");

  const { runDataIntegrityScan, runSmokeTests } = await import("../src/lib/launch");
  const integrity = await runDataIntegrityScan(company.id);
  const fails = integrity.filter((c) => c.severity === "fail");
  const smoke = await runSmokeTests(company.id);
  const smokeFails = smoke.filter((s) => !s.ok);

  console.log(
    JSON.stringify(
      {
        ok: smokeFails.length === 0 && fails.length === 0,
        preservedIds: { company: company.id, property: property.id, turnover: turnover.id },
        sessionsTransferred: sessions,
        integrityFails: fails.length,
        smokeFails: smokeFails.length,
        smokePassed: smoke.filter((s) => s.ok).length,
        refusedUnsafeTarget,
        refusedAmbiguousTarget,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
  if (smokeFails.length || fails.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
