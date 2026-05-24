import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import {
  campaigns,
  worshipPlaces,
  assets,
  campaignAssets,
  expenses,
  donations,
  activityLogs,
  energyData,
} from "../db/schema/index.js";
import { usersSeedData } from "./users.data.js";
import { getWorshipPlacesSeedData } from "./worship-places.data.js";
import { getCampaignsSeedData } from "./campaigns.data.js";
import { getDonationsSeedData } from "./donations.data.js";
import { assetsSeedData } from "./assets.data.js";
import { getCampaignAssetsSeedData } from "./campaign-assets.data.js";
import { getExpensesSeedData } from "./expenses.data.js";
import { getActivityLogsSeedData } from "./activity-logs.data.js";
import { getEnergySeedData } from "./energy.data.js";
import { upsertUsersByEmail } from "../lib/db-seed.js";

const client = postgres(env.databaseUrl, { prepare: false });
const db = drizzle(client);

async function main(): Promise<void> {
  console.log("Memulai proses seeding database Sunity...");

  try {
    console.log("Upsert data users (idempotent)...");
    const insertedUsers = await upsertUsersByEmail(db, usersSeedData);
    const adminUser = insertedUsers.find((u) => u.role === "admin");
    const donorUser = insertedUsers.find((u) => u.email === "rian@gmail.com");

    if (!adminUser) {
      throw new Error("Gagal menemukan admin user untuk seeding log.");
    }

    console.log("Menghapus data lama dengan memperhatikan foreign key constraint...");
    await db.delete(activityLogs);
    await db.delete(energyData);
    await db.delete(campaignAssets);
    await db.delete(expenses);
    await db.delete(donations);
    await db.delete(campaigns);
    await db.delete(worshipPlaces);
    await db.delete(assets);

    console.log("Memulai pengisian data (seeding)...");

    console.log("1. Menyuntik data assets...");
    const insertedAssets = await db.insert(assets).values(assetsSeedData).returning();

    // Map thumbnail asset IDs
    const thumbnailAssetIds = insertedAssets
      .filter((a) => a.storageKey.startsWith("worship-places/thumbnails/"))
      .map((a) => a.id);

    console.log("2. Menyuntik data worship places...");
    const insertedWorshipPlaces = await db
      .insert(worshipPlaces)
      .values(getWorshipPlacesSeedData(thumbnailAssetIds))
      .returning();

    const worshipPlaceIds = insertedWorshipPlaces.map((wp) => wp.id);

    console.log("3. Menyuntik data campaigns...");
    const insertedCampaigns = await db
      .insert(campaigns)
      .values(getCampaignsSeedData(worshipPlaceIds))
      .returning();

    console.log("4. Menyuntik data campaign assets...");
    const campaignAssetsData = getCampaignAssetsSeedData(insertedCampaigns);
    if (campaignAssetsData.length > 0) {
      await db.insert(campaignAssets).values(campaignAssetsData);
    }

    console.log("5. Menyuntik data expenses...");
    const expensesData = getExpensesSeedData(insertedCampaigns);
    if (expensesData.length > 0) {
      await db.insert(expenses).values(expensesData);
    }

    console.log("6. Menyuntik data donations...");
    const donationsData = getDonationsSeedData(insertedCampaigns, donorUser?.id);
    if (donationsData.length > 0) {
      await db.insert(donations).values(donationsData);
    }

    console.log("7. Menyuntik data activity logs...");
    const activityLogsData = getActivityLogsSeedData(insertedCampaigns, adminUser.id);
    if (activityLogsData.length > 0) {
      await db.insert(activityLogs).values(activityLogsData);
    }

    console.log("8. Menyuntik data energy records...");
    const energyDataRecords = getEnergySeedData(insertedCampaigns);
    if (energyDataRecords.length > 0) {
      await db.insert(energyData).values(energyDataRecords);
    }

    console.log("✓ Database berhasil di-seed penuh untuk pengujian semua endpoint.");
  } catch (error) {
    console.error("✗ Seeding database gagal dilakukan:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
