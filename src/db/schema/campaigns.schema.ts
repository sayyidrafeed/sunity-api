import { boolean, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetIdr: numeric("target_idr", { precision: 15, scale: 2 }).notNull(),
  panelCapacityKwp: numeric("panel_capacity_kwp", { precision: 8, scale: 2 }).notNull(),
  raisedIdr: numeric("raised_idr", { precision: 15, scale: 2 }).default("0").notNull(),
  donorCount: integer("donor_count").default(0).notNull(),

  estimatedKwhAnnual: numeric("estimated_kwh_annual", { precision: 10, scale: 2 }),
  estimatedIdrSavings: numeric("estimated_idr_savings", { precision: 15, scale: 2 }),

  coverImageUrl: text("cover_image_url"),
  status: text("status").$type<"Aktif" | "Instalasi" | "Selesai">().default("Aktif").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  worshipPlaceName: text("worship_place_name").notNull(),
  city: text("city").notNull(),
  religionType: text("religion_type")
    .$type<"Masjid" | "Mushalla" | "Gereja" | "Pura" | "Vihara" | "Klenteng">()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
