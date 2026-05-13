import postgres from "postgres";
import "dotenv/config";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  const email = "admin@nexiaatrack.com";
  const password = "adminpassword"; // User should change this
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Seeding admin user: ${email}`);
  
  await sql`
    INSERT INTO "users" ("email", "password", "name", "role")
    VALUES (${email}, ${hashedPassword}, 'Nexiaa Admin', 'admin')
    ON CONFLICT ("email") DO NOTHING
  `;

  console.log("Admin user seeded.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
