import { pgTable, uuid, text, timestamp, integer, foreignKey, varchar } from "drizzle-orm/pg-core";
import { campaigns } from "./campaigns.schema.js";
import { assets } from "./assets.schema.js";

export const campaignAssets = pgTable(
  "campaign_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: uuid("campaign_id").notNull(),
    assetId: uuid("asset_id").notNull(),
    kind: varchar("kind", {
      enum: ["cover", "gallery", "transparency", "installation", "report"],
    })
      .notNull()
      .default("cover"),
    sortOrder: integer("sort_order").default(0).notNull(),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    campaignIdFk: foreignKey({
      columns: [table.campaignId],
      foreignColumns: [campaigns.id],
      name: "campaign_assets_campaign_id_fk",
    }).onDelete("cascade"),
    assetIdFk: foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "campaign_assets_asset_id_fk",
    }).onDelete("cascade"),
  }),
);

export type CampaignAsset = typeof campaignAssets.$inferSelect;
export type NewCampaignAsset = typeof campaignAssets.$inferInsert;
