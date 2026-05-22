CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_idr" numeric(15, 2) NOT NULL,
	"panel_capacity_kwp" numeric(8, 2) NOT NULL,
	"estimated_kwh_annual" numeric(10, 2),
	"estimated_idr_savings" numeric(15, 2),
	"cover_image_url" text,
	"status" text DEFAULT 'fundraising' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"worship_place_name" text NOT NULL,
	"city" text NOT NULL,
	"religion_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "value" SET DATA TYPE text;