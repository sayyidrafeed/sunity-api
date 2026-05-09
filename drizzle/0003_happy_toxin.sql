ALTER TABLE "users" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "raised_idr" numeric(15, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "donor_count" integer DEFAULT 0 NOT NULL;