import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, campaigns, donations } from "../db/schema/index.js";
import { usersSeedData } from "./users.data.js";
import { getCampaignsSeedData } from "./campaigns.data.js";
import { getDonationsSeedData } from "./donations.data.js";

const dbUrl =
  (process.env as any).DATABASE_URL ||
  "postgres://desi_dev:desi_password_local@localhost:5433/sunity_dev_db";

const pool = new pg.Pool({
  connectionString: dbUrl,
});
const db = drizzle(pool);

async function main(): Promise<void> {
  console.log("Memulai proses seeding database Sunity...");

  try {
    console.log("Mengosongkan data tabel lama di Docker...");
    await db.delete(donations);
    await db.delete(campaigns);
    await db.delete(users);

    console.log("Menyuntikkan data users...");
    const insertedUsers = await db
      .insert(users)
      .values(usersSeedData as any)
      .returning();

    const donor = insertedUsers.find((u) => u.email === "rian@gmail.com");

    if (!donor) {
      throw new Error("Gagal memetakan akun user untuk relasi database.");
    }

    console.log("Menyuntikkan data campaigns...");
    const staticWorshipPlaceId = "00000000-0000-0000-0000-000000000000";
    const insertedCampaigns = await db
      .insert(campaigns)
      .values(getCampaignsSeedData(staticWorshipPlaceId) as any)
      .returning();

    console.log("Menyuntikkan data transaksi donations...");
    await db.insert(donations).values(getDonationsSeedData(insertedCampaigns, donor.id) as any);

    console.log("Database lokal berhasil di-seed penuh untuk pengujian semua endpoint.");
    process.exit(0);
  } catch (error) {
    // Memakai variabel 'error' agar linter tidak protes lagi
    console.error("Seeding database gagal dilakukan:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
