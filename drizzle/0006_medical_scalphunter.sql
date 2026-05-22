CREATE TABLE "worship_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"religion_type" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"contact_person" text,
	"contact_phone" text,
	"current_condition" text,
	"person_in_charge" text,
	"thumbnail_asset_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "target_idr" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "raised_idr" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "estimated_idr_savings" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "status" SET DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "worship_place_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "worship_places" ADD CONSTRAINT "worship_places_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_worship_place_id_worship_places_id_fk" FOREIGN KEY ("worship_place_id") REFERENCES "public"."worship_places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN "worship_place_name";--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "campaigns" DROP COLUMN "religion_type";