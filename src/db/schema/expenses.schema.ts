import { bigint, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.schema.js";
import { assets } from "./assets.schema.js";

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amountIdr: bigint("amount_idr", { mode: "number" }).notNull(),
  spentAt: timestamp("spent_at", { withTimezone: true }).notNull(),
  receiptAssetId: uuid("receipt_asset_id").references(() => assets.id),
  category: text("category")
    .$type<"EQUIPMENT" | "INSTALLATION" | "MATERIAL" | "OPERATIONAL" | "OTHER">()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
