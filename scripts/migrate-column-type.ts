import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";
import { sql } from "drizzle-orm";
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
  console.log("Altering shipments.shipping_cost column to VARCHAR...");
  try {
    await db.execute(sql`
      ALTER TABLE shipments 
      ALTER COLUMN shipping_cost TYPE varchar(100);
    `);
    console.log("Column type successfully altered to VARCHAR!");
  } catch (error) {
    console.error("Error altering column type:", error);
  } finally {
    await client.end();
  }
}

main();
