import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function main() {
  console.log("Migrating existing invoices currency to EUR...");
  try {
    await db.update(schema.invoices).set({ currency: "EUR" });
    console.log("Migration successful!");
  } catch (error) {
    console.error("Error migrating invoices:", error);
  } finally {
    await client.end();
  }
}

main();
