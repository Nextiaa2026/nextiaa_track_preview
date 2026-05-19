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
  console.log("Migrating existing shipment shipping costs from cents to whole units...");
  try {
    await db.execute(sql`
      UPDATE shipments 
      SET shipping_cost = CAST(ROUND(CAST(shipping_cost AS numeric) / 100) AS varchar)
      WHERE shipping_cost ~ '^[0-9.]+$' AND CAST(shipping_cost AS numeric) > 100;
    `);
    console.log("Migration of shipment shipping costs successful!");
  } catch (error) {
    console.error("Error migrating shipment shipping costs:", error);
  } finally {
    await client.end();
  }
}

main();
