import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  console.log("Dropping all tables...");
  await sql`DROP TABLE IF EXISTS "invoices" CASCADE`;
  await sql`DROP TABLE IF EXISTS "shipments" CASCADE`;
  await sql`DROP TABLE IF EXISTS "trip_logs" CASCADE`;
  await sql`DROP TABLE IF EXISTS "trips" CASCADE`;
  await sql`DROP TABLE IF EXISTS "customers" CASCADE`;
  await sql`DROP TABLE IF EXISTS "vessels" CASCADE`;
  await sql`DROP TABLE IF EXISTS "users" CASCADE`;
  await sql`DROP TABLE IF EXISTS "accounts" CASCADE`;
  await sql`DROP TABLE IF EXISTS "sessions" CASCADE`;
  await sql`DROP TABLE IF EXISTS "verification_tokens" CASCADE`;
  await sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`;
  // Legacy table (may not exist)
  await sql`DROP TABLE IF EXISTS "shipment_logs" CASCADE`;
  console.log("All tables dropped.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
