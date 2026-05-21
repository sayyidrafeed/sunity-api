import { bigint, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.schema.js";

export const energyData = pgTable("energy_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  kwhProduced: bigint("kwh_produced", { mode: "number" }).notNull(),
  idrSaved: bigint("idr_saved", { mode: "number" }).notNull(),
  kgCo2Reduced: bigint("kg_co2_reduced", { mode: "number" }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EnergyData = typeof energyData.$inferSelect;
export type NewEnergyData = typeof energyData.$inferInsert;
