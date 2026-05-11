import {
  bigint,
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { worshipPlaces } from "./worship-places.schema.js";

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetIdr: bigint("target_idr", { mode: "number" }).notNull(),
  panelCapacityKwp: numeric("panel_capacity_kwp", { precision: 8, scale: 2 }).notNull(),
  raisedIdr: bigint("raised_idr", { mode: "number" }).default(0).notNull(),
  donorCount: integer("donor_count").default(0).notNull(),

  estimatedKwhAnnual: numeric("estimated_kwh_annual", { precision: 10, scale: 2 }),
  estimatedIdrSavings: bigint("estimated_idr_savings", { mode: "number" }),

  fundUsage: text("fund_usage"),
  energyProducedKwhMonthly: numeric("energy_produced_kwh_monthly", { precision: 10, scale: 2 }),
  beneficiaries: integer("beneficiaries"),
  carbonReductionKgMonthly: numeric("carbon_reduction_kg_monthly", { precision: 10, scale: 2 }),
  electricitySavingsIdrMonthly: bigint("electricity_savings_idr_monthly", { mode: "number" }),
  impactDescription: text("impact_description"),

  coverImageUrl: text("cover_image_url"),
  status: text("status")
    .$type<"DRAFT" | "AKTIF" | "INSTALASI" | "SELESAI" | "ARCHIVED">()
    .default("DRAFT")
    .notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  worshipPlaceId: uuid("worship_place_id")
    .references(() => worshipPlaces.id)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
