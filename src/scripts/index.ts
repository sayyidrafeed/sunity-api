import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import { campaigns, worshipPlaces } from "../db/schema/index.js";
import { usersSeedData } from "./users.data.js";
import { getWorshipPlacesSeedData } from "./worship-places.data.js";
import { getCampaignsSeedData } from "./campaigns.data.js";
import { getDonationsSeedData } from "./donations.data.js";
import { upsertUsersByEmail, upsertDonationsByMidtransId } from "../lib/db-seed.js";

const client = postgres(env.databaseUrl, { prepare: false });
const db = drizzle(client);

async function main(): Promise<void> {
  console.log("Memulai proses seeding database Sunity...");

  try {
    console.log("Upsert data users (idempotent)...");
    const insertedUsers = await upsertUsersByEmail(db, usersSeedData);

    console.log("Menghapus dan menambahkan data campaigns dan worship places...");
    // Delete campaigns first due to foreign key constraint
    await db.delete(campaigns);
    await db.delete(worshipPlaces);
    const insertedWorshipPlaces = await db
      .insert(worshipPlaces)
      .values(getWorshipPlacesSeedData())
      .returning();

    const firstWorshipPlace = insertedWorshipPlaces[0];
    if (!firstWorshipPlace) {
      throw new Error("Gagal menyuntik data worship place.");
    }

    console.log("Menghapus dan menambahkan data campaigns...");
    await db.delete(campaigns);
    const insertedCampaigns = await db
      .insert(campaigns)
      .values(getCampaignsSeedData(firstWorshipPlace.id))
      .returning();

    console.log("Upsert data transaksi donations (idempotent)...");
    const donor = insertedUsers.find((u) => u.email === "rian@gmail.com");
    const donorId = donor?.id ?? "unknown";
    await upsertDonationsByMidtransId(db, getDonationsSeedData(insertedCampaigns, donorId));

    console.log("✓ Database berhasil di-seed penuh untuk pengujian semua endpoint.");
  } catch (error) {
    console.error("✗ Seeding database gagal dilakukan:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
