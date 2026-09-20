import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://aethelgard:dev-only-password@localhost:5432/aethelgard";

// Disable prefetch as it is not supported for "Transaction" pool mode if using pooling
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { schema };
