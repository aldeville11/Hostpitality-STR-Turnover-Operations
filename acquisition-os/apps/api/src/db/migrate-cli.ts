import { createSqlDb, loadMigrationSql } from "./client.js";

async function main() {
  const { db, kind } = await createSqlDb();
  console.log(JSON.stringify({ msg: "migrations applied", kind, bytes: loadMigrationSql().length }));
  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
