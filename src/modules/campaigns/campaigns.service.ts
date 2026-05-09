import { eq, ilike, and, sql, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaigns, campaignAssets, assets } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
} from "./campaigns.schema.js";
import { mapCampaignToCard, mapCampaignToDetail } from "./campaigns.mappers.js";

export class CampaignNotFoundError extends Error {
  constructor(id?: string) {
    super(`Campaign ${id ? `(${id}) ` : ""}not found`);
    this.name = "CampaignNotFoundError";
  }
}

export class AssetNotFoundError extends Error {
  constructor(id?: string) {
    super(`Asset ${id ? `(${id}) ` : ""}not found`);
    this.name = "AssetNotFoundError";
  }
}

/**
 * Get campaign card with cover image (for list view)
 */
export async function getCampaignCard(id: string) {
  const campaign = await getCampaignById(id);
  return mapCampaignToCard(campaign);
}

/**
 * Get campaign detail with all images grouped by kind (for detail view)
 */
export async function getCampaignDetail(id: string) {
  const campaign = await getCampaignById(id);
  return mapCampaignToDetail(campaign);
}

export async function createCampaign(userId: string, data: z.infer<typeof createCampaignSchema>) {
  const { deadline, ...rest } = data;
  const [campaign] = await db
    .insert(campaigns)
    .values({
      ...rest,
      deadline: new Date(deadline),
    })
    .returning();
  return campaign;
}

export async function listCampaigns(query: z.infer<typeof listCampaignQuerySchema>) {
  const { page, limit, search, city, type, status } = query;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (search) {
    conditions.push(
      or(ilike(campaigns.title, `%${search}%`), ilike(campaigns.city, `%${search}%`)),
    );
  }
  if (city) conditions.push(ilike(campaigns.city, `%${city}%`));
  if (type) conditions.push(eq(campaigns.religionType, type));
  if (status) conditions.push(eq(campaigns.status, status));
  conditions.push(eq(campaigns.isPublished, true));
  const where = conditions.length ? and(...conditions) : undefined;
  const [data, countResult] = await Promise.all([
    db.select().from(campaigns).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(where),
  ]);

  // Map campaigns to card DTOs with asset joins
  const cards = await Promise.all(data.map((campaign) => mapCampaignToCard(campaign)));

  return {
    data: cards,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

export async function getCampaignById(id: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function updateCampaign(id: string, data: z.infer<typeof updateCampaignSchema>) {
  const { deadline, ...rest } = data;
  const updateData: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (deadline) {
    updateData.deadline = new Date(deadline);
  }
  const [campaign] = await db
    .update(campaigns)
    .set(updateData)
    .where(eq(campaigns.id, id))
    .returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function updateCampaignStatus(id: string, data: z.infer<typeof updateStatusSchema>) {
  const [campaign] = await db
    .update(campaigns)
    .set({
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id))
    .returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function publishCampaign(id: string, data: z.infer<typeof publishSchema>) {
  const [campaign] = await db
    .update(campaigns)
    .set({
      isPublished: data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, id))
    .returning();

  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function deleteCampaign(id: string) {
  const [campaign] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function attachAssetToCampaign(
  campaignId: string,
  input: {
    assetId: string;
    kind: "cover" | "gallery" | "transparency" | "installation" | "report";
    sortOrder: number;
    caption?: string;
  },
) {
  // Verify campaign exists
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new CampaignNotFoundError(campaignId);

  // Verify asset exists
  const [asset] = await db.select().from(assets).where(eq(assets.id, input.assetId));
  if (!asset) throw new AssetNotFoundError(input.assetId);

  // Attach asset
  const [campaignAsset] = await db
    .insert(campaignAssets)
    .values({
      campaignId,
      assetId: input.assetId,
      kind: input.kind,
      sortOrder: input.sortOrder,
      caption: input.caption,
    })
    .returning();

  return campaignAsset;
}
