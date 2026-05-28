import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Campaign lifecycle status.
 * PostgreSQL: CREATE TYPE "campaign_status" AS ENUM (...)
 */
export const campaignStatusValues = ["DRAFT", "AKTIF", "INSTALASI", "SELESAI", "ARCHIVED"] as const;
export const campaignStatusEnum = pgEnum("campaign_status", campaignStatusValues);
export type CampaignStatus = (typeof campaignStatusValues)[number];

/**
 * Worship place religion type.
 * PostgreSQL: CREATE TYPE "religion_type" AS ENUM (...)
 *
 * Note: "Mushalla" was intentionally excluded — it is considered equivalent
 * to "Masjid" in this domain. All worship places of that type should use
 * "Masjid" instead.
 */
export const religionTypeValues = ["Masjid", "Gereja", "Pura", "Vihara", "Klenteng"] as const;
export const religionTypeEnum = pgEnum("religion_type", religionTypeValues);
export type ReligionType = (typeof religionTypeValues)[number];

/**
 * Expense category classification.
 * PostgreSQL: CREATE TYPE "expense_category" AS ENUM (...)
 */
export const expenseCategoryValues = [
  "EQUIPMENT",
  "INSTALLATION",
  "MATERIAL",
  "OPERATIONAL",
  "OTHER",
] as const;
export const expenseCategoryEnum = pgEnum("expense_category", expenseCategoryValues);
export type ExpenseCategory = (typeof expenseCategoryValues)[number];

/**
 * Campaign asset kind / slot type.
 * PostgreSQL: CREATE TYPE "campaign_asset_kind" AS ENUM (...)
 */
export const campaignAssetKindValues = [
  "cover",
  "gallery",
  "transparency",
  "installation",
  "report",
  "other",
] as const;
export const campaignAssetKindEnum = pgEnum("campaign_asset_kind", campaignAssetKindValues);
export type CampaignAssetKind = (typeof campaignAssetKindValues)[number];

/**
 * Donation payment status.
 * PostgreSQL: CREATE TYPE "donation_status" AS ENUM (...)
 */
export const donationStatusValues = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export const donationStatusEnum = pgEnum("donation_status", donationStatusValues);
export type DonationStatus = (typeof donationStatusValues)[number];
