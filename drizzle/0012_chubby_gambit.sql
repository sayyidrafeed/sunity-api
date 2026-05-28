CREATE TYPE "public"."campaign_asset_kind" AS ENUM('cover', 'gallery', 'transparency', 'installation', 'report', 'other');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'AKTIF', 'INSTALASI', 'SELESAI', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('EQUIPMENT', 'INSTALLATION', 'MATERIAL', 'OPERATIONAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."religion_type" AS ENUM('Masjid', 'Gereja', 'Pura', 'Vihara', 'Klenteng');--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."campaign_status";--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "status" SET DATA TYPE "public"."campaign_status" USING "status"::"public"."campaign_status";--> statement-breakpoint
ALTER TABLE "campaign_assets" ALTER COLUMN "kind" SET DEFAULT 'cover'::"public"."campaign_asset_kind";--> statement-breakpoint
ALTER TABLE "campaign_assets" ALTER COLUMN "kind" SET DATA TYPE "public"."campaign_asset_kind" USING "kind"::"public"."campaign_asset_kind";--> statement-breakpoint
ALTER TABLE "worship_places" ALTER COLUMN "religion_type" SET DATA TYPE "public"."religion_type" USING "religion_type"::"public"."religion_type";--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "category" SET DATA TYPE "public"."expense_category" USING "category"::"public"."expense_category";--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."donation_status";--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "status" SET DATA TYPE "public"."donation_status" USING "status"::"public"."donation_status";--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "energy_data" ADD CONSTRAINT "energy_data_campaign_month_unique" UNIQUE("campaign_id","month");