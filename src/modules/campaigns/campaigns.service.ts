import { eq, ilike, and, sql, or } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaigns, campaignAssets, assets, worshipPlaces } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
  listCampaignAdminQuerySchema,
} from "./campaigns.schema.js";
import { mapCampaignToCard, mapCampaignToDetail } from "./campaigns.mappers.js";
import { NotFoundError } from "../../lib/errors.js";

export class CampaignNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Campaign not found", "CAMPAIGN_NOT_FOUND", id ? `campaignId=${id}` : undefined);
  }
}

export class AssetNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Asset not found", "ASSET_NOT_FOUND", id ? `assetId=${id}` : undefined);
  }
}

/**
 * Get campaign card with cover image (for list view)
 */
export async function getCampaignCard(id: string) {
  const campaign = await getCampaignById(id);
  return mapCampaignToCard(campaign.campaign, campaign.worshipPlace);
}

/**
 * Get campaign detail with all images grouped by kind (for detail view)
 */
export async function getCampaignDetail(id: string) {
  const campaign = await getCampaignById(id);
  return mapCampaignToDetail(campaign.campaign, campaign.worshipPlace);
}

export async function createCampaign(userId: string, data: z.infer<typeof createCampaignSchema>) {
  const { deadline, ...rest } = data;
  const [campaign] = await db
    .insert(campaigns)
    .values({
      ...rest,
      energyProducedKwhMonthly: rest.energyProducedKwhMonthly ?? undefined,
      carbonReductionKgMonthly: rest.carbonReductionKgMonthly ?? undefined,
      deadline: new Date(deadline),
    })
    .returning();
  return campaign;
}

/**
 * Internal list function with conditional publishing filter
 */
async function listCampaignsInternal(
  query: z.infer<typeof listCampaignQuerySchema> & {
    isPublishedOnly?: boolean;
  },
) {
  const { page, limit, search, city, type, status, sortBy, order, isPublishedOnly = true } = query;
  const offset = (page - 1) * limit;
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(campaigns.title, `%${search}%`),
        ilike(worshipPlaces.name, `%${search}%`),
        ilike(worshipPlaces.city, `%${search}%`),
      ),
    );
  }
  if (city) conditions.push(ilike(worshipPlaces.city, `%${city}%`));
  if (type) conditions.push(eq(worshipPlaces.religionType, type));
  if (status) conditions.push(eq(campaigns.status, status));
  if (isPublishedOnly) conditions.push(eq(campaigns.isPublished, true));
  const where = conditions.length ? and(...conditions) : undefined;
  const orderBy =
    sortBy === "deadline"
      ? campaigns.deadline
      : sortBy === "targetIdr"
        ? campaigns.targetIdr
        : sortBy === "raisedProgress"
          ? // Using ::float for sorting is acceptable here since we're only ranking
            // campaigns by progress, not performing financial calculations requiring precision.
            // For financial calculations, consider multiplying before dividing to maintain integer precision.
            sql<number>`CASE WHEN ${campaigns.targetIdr} = 0 THEN 0 ELSE ${campaigns.raisedIdr}::float / ${campaigns.targetIdr}::float END`
          : campaigns.createdAt;

  const orderByClause = order === "asc" ? orderBy : sql`${orderBy} DESC`;

  const [data, countResult] = await Promise.all([
    db
      .select({
        campaign: campaigns,
        worshipPlace: worshipPlaces,
      })
      .from(campaigns)
      .innerJoin(worshipPlaces, eq(campaigns.worshipPlaceId, worshipPlaces.id))
      .where(where)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .innerJoin(worshipPlaces, eq(campaigns.worshipPlaceId, worshipPlaces.id))
      .where(where),
  ]);

  // Fetch all cover assets for the campaigns in a single query
  const campaignIds = data.map((c) => c.campaign.id);
  const coverAssets = await db
    .select({
      campaignId: campaignAssets.campaignId,
      assetId: assets.id,
      storageKey: assets.storageKey,
    })
    .from(campaignAssets)
    .innerJoin(assets, eq(campaignAssets.assetId, assets.id))
    .where(
      and(
        sql`${campaignAssets.campaignId} = ANY(${campaignIds})`,
        eq(campaignAssets.kind, "cover"),
      ),
    );

  // Create a map for quick asset lookup
  const assetMap = new Map(coverAssets.map((a) => [a.campaignId, a]));

  // Map campaigns to card DTOs with preloaded assets
  const cards = data.map((row) =>
    mapCampaignToCard(row.campaign, row.worshipPlace, assetMap.get(row.campaign.id)),
  );

  return {
    data: cards,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

/**
 * List public campaigns (published only)
 */
export async function listCampaignsPublic(query: z.infer<typeof listCampaignQuerySchema>) {
  return listCampaignsInternal({ ...query, isPublishedOnly: true });
}

/**
 * List campaigns for admin with optional unpublished filter
 */
export async function listCampaignsAdmin(query: z.infer<typeof listCampaignAdminQuerySchema>) {
  const { includeUnpublished, ...rest } = query;
  return listCampaignsInternal({
    ...rest,
    isPublishedOnly: !includeUnpublished,
  });
}

export async function getCampaignById(id: string) {
  const [row] = await db
    .select({
      campaign: campaigns,
      worshipPlace: worshipPlaces,
    })
    .from(campaigns)
    .innerJoin(worshipPlaces, eq(campaigns.worshipPlaceId, worshipPlaces.id))
    .where(eq(campaigns.id, id));
  if (!row) throw new CampaignNotFoundError(id);
  return row;
}

export async function updateCampaign(id: string, data: z.infer<typeof updateCampaignSchema>) {
  const { deadline, ...rest } = data;
  const updateData: Record<string, unknown> = {
    ...rest,
    energyProducedKwhMonthly: rest.energyProducedKwhMonthly ?? undefined,
    carbonReductionKgMonthly: rest.carbonReductionKgMonthly ?? undefined,
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
  await getCampaignById(campaignId);

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
