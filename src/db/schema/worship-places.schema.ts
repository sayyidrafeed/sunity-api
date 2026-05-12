import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { assets } from "./assets.schema.js";

export const worshipPlaces = pgTable("worship_places", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  religionType: text("religion_type")
    .$type<"Masjid" | "Mushalla" | "Gereja" | "Pura" | "Vihara" | "Klenteng">()
    .notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  currentCondition: text("current_condition"),
  personInCharge: text("person_in_charge"),
  thumbnailAssetId: uuid("thumbnail_asset_id").references(() => assets.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type WorshipPlace = typeof worshipPlaces.$inferSelect;
export type NewWorshipPlace = typeof worshipPlaces.$inferInsert;
