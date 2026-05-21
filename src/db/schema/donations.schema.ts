import { pgTable, uuid, bigint, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.schema.js";

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
  status: text("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
