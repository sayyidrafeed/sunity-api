CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"donor_name" text DEFAULT 'Anonim' NOT NULL,
	"donor_email" text NOT NULL,
	"amount_idr" bigint NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"midtrans_order_id" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_midtrans_order_id_unique" UNIQUE("midtrans_order_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "access_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;