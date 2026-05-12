ALTER TABLE "campaigns" ADD COLUMN "fund_usage" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "energy_produced_kwh_monthly" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "beneficiaries" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "carbon_reduction_kg_monthly" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "electricity_savings_idr_monthly" bigint;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "impact_description" text;