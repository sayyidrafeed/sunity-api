import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import { users, campaigns, donations, worshipPlaces } from "../db/schema/index.js";
import { usersSeedData } from "./users.data.js";
import { getWorshipPlacesSeedData } from "./worship-places.data.js";
import { getCampaignsSeedData } from "./campaigns.data.js";
import { getDonationsSeedData } from "./donations.data.js";

const client = postgres(env.databaseUrl, { prepare: false });
const db = drizzle(client);

async function main(): Promise<void> {
  console.log("Memulai proses seeding database Sunity...");

  try {
    console.log("Mengosongkan data tabel lama...");
    await db.delete(donations);
    await db.delete(campaigns);
    await db.delete(worshipPlaces);
    await db.delete(users);

    console.log("Menyuntikkan data users...");
    const insertedUsers = await db.insert(users).values(usersSeedData).returning();

    console.log("Menyuntikkan data worship places...");
    const insertedWorshipPlaces = await db
      .insert(worshipPlaces)
      .values(getWorshipPlacesSeedData())
      .returning();

    const firstWorshipPlace = insertedWorshipPlaces[0];
    if (!firstWorshipPlace) {
      throw new Error("Gagal menyuntik data worship place.");
    }

    console.log("Menyuntikkan data campaigns...");
    const insertedCampaigns = await db
      .insert(campaigns)
      .values(getCampaignsSeedData(firstWorshipPlace.id))
      .returning();

    console.log("Menyuntikkan data transaksi donations...");
    const donor = insertedUsers.find((u) => u.email === "rian@gmail.com");
    const donorId = donor?.id ?? "unknown";
    await db.insert(donations).values(getDonationsSeedData(insertedCampaigns, donorId));

    console.log("✓ Database berhasil di-seed penuh untuk pengujian semua endpoint.");
  } catch (error) {
    console.error("✗ Seeding database gagal dilakukan:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
