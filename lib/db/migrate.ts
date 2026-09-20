import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runMigrations() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://aethelgard:dev-only-password@localhost:5432/aethelgard";

  console.log("[DB] Connecting to PostgreSQL to run migrations...");
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log("[DB] Applying migrations from ./drizzle...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[DB] Migrations applied successfully.");
  } catch (error) {
    console.error("[DB] Migration failed:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
