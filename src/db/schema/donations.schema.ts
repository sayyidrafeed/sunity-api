import { pgTable, uuid, bigint, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.schema.js";
import { donationStatusEnum } from "./enums.schema.js";

export const donations = pgTable("donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id, { onDelete: "cascade" })
    .notNull(),
  donorName: text("donor_name").default("Anonim").notNull(),
  donorEmail: text("donor_email").notNull(),
  amountIdr: bigint("amount_idr", { mode: "number" }).notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  midtransOrderId: text("midtrans_order_id").notNull().unique(),
  status: donationStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
