import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaignAssets, assets as assetsTable } from "../../db/schema/index.js";
import { env } from "../../env.js";
import type { campaignCardSchema, campaignDetailSchema } from "./campaigns.schema.js";
import type { z } from "zod";

/**
 * Compute public URL for an asset from storageKey
 */
export function getAssetPublicUrl(storageKey: string): string {
  const cdnBase =
    env.r2CustomDomain || (env.r2BucketName ? `https://${env.r2BucketName}.r2.amazonaws.com` : "");
  if (!cdnBase) return "";
  return `${cdnBase}/${storageKey}`;
}

/**
 * Build campaign card DTO with cover image from asset join
 */
export async function mapCampaignToCard(
  campaign: any,
): Promise<z.infer<typeof campaignCardSchema>> {
  // Fetch cover asset if it exists
  let coverImage = null;
  const coverAssets = await db
    .select({
      assetId: assetsTable.id,
      storageKey: assetsTable.storageKey,
    })
    .from(campaignAssets)
    .innerJoin(assetsTable, eq(campaignAssets.assetId, assetsTable.id))
    .where(and(eq(campaignAssets.campaignId, campaign.id), eq(campaignAssets.kind, "cover")))
    .limit(1);

  if (coverAssets.length > 0) {
    const asset = coverAssets[0];
    coverImage = {
      assetId: asset.assetId,
      publicUrl: getAssetPublicUrl(asset.storageKey),
      storageKey: asset.storageKey,
    };
  }

  return {
    id: campaign.id,
    title: campaign.title,
    city: campaign.city,
    religionType: campaign.religionType,
    status: campaign.status,
    targetIdr: campaign.targetIdr,
    raisedIdr: campaign.raisedIdr || "0",
    donorCount: campaign.donorCount || 0,
    deadline: campaign.deadline.toISOString(),
    progressPercent: campaign.raisedIdr
      ? Math.min(
          100,
          Math.round((parseFloat(campaign.raisedIdr) / parseFloat(campaign.targetIdr)) * 100),
        )
      : 0,
    coverImage,
  };
}

/**
 * Build campaign detail DTO with all asset images grouped by kind
 */
export async function mapCampaignToDetail(
  campaign: any,
): Promise<z.infer<typeof campaignDetailSchema>> {
  // Fetch all campaign assets with full asset data
  const campaignAssetRecords = await db
    .select({
      kind: campaignAssets.kind,
      sortOrder: campaignAssets.sortOrder,
      caption: campaignAssets.caption,
      assetId: assetsTable.id,
      storageKey: assetsTable.storageKey,
    })
    .from(campaignAssets)
    .innerJoin(assetsTable, eq(campaignAssets.assetId, assetsTable.id))
    .where(eq(campaignAssets.campaignId, campaign.id))
    .orderBy(campaignAssets.sortOrder);

  // Group assets by kind
  const imagesByKind = {
    cover: null as any,
    gallery: [] as any[],
    transparency: [] as any[],
    installation: [] as any[],
  };

  for (const record of campaignAssetRecords) {
    const imageData = {
      assetId: record.assetId,
      publicUrl: getAssetPublicUrl(record.storageKey),
      storageKey: record.storageKey,
      caption: record.caption ?? undefined,
    };

    if (record.kind === "cover") {
      imagesByKind.cover = imageData;
    } else if (record.kind in imagesByKind) {
      imagesByKind[record.kind as keyof typeof imagesByKind].push(imageData);
    }
  }

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    targetIdr: campaign.targetIdr,
    raisedIdr: campaign.raisedIdr || "0",
    donorCount: campaign.donorCount || 0,
    deadline: campaign.deadline.toISOString(),
    progressPercent: campaign.raisedIdr
      ? Math.min(
          100,
          Math.round((parseFloat(campaign.raisedIdr) / parseFloat(campaign.targetIdr)) * 100),
        )
      : 0,
    worshipPlace: {
      name: campaign.worshipPlaceName,
      city: campaign.city,
      religionType: campaign.religionType,
    },
    energyImpact: {
      panelCapacityKwp: campaign.panelCapacityKwp,
      estimatedKwhAnnual: campaign.estimatedKwhAnnual ?? undefined,
      estimatedIdrSavings: campaign.estimatedIdrSavings ?? undefined,
    },
    images: {
      cover: imagesByKind.cover,
      gallery: imagesByKind.gallery,
      transparency: imagesByKind.transparency,
      installation: imagesByKind.installation,
    },
    published: campaign.isPublished,
  };
}
