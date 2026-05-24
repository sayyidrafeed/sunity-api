import { eq, and } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaignAssets, assets as assetsTable } from "../../db/schema/index.js";
import type { Campaign } from "../../db/schema/campaigns.schema.js";
import type { WorshipPlace } from "../../db/schema/worship-places.schema.js";
import { env } from "../../env.js";
import type {
  campaignCardSchema,
  campaignDetailSchema,
  campaignSummarySchema,
} from "./campaigns.schema.js";
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
  campaign: Campaign,
  worshipPlace: WorshipPlace,
  preloadedCoverAsset?: { assetId: string; storageKey: string } | null,
): Promise<z.infer<typeof campaignCardSchema>> {
  // Use preloaded asset if provided, otherwise fetch it
  let coverImage = null;
  if (preloadedCoverAsset) {
    coverImage = {
      assetId: preloadedCoverAsset.assetId,
      publicUrl: getAssetPublicUrl(preloadedCoverAsset.storageKey),
      storageKey: preloadedCoverAsset.storageKey,
    };
  } else {
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
  }

  return {
    id: campaign.id,
    title: campaign.title,
    worshipPlace: {
      name: worshipPlace.name,
      city: worshipPlace.city,
      religionType: worshipPlace.religionType,
      address: worshipPlace.address,
    },
    status: campaign.status,
    targetIdr: campaign.targetIdr,
    raisedIdr: campaign.raisedIdr || 0,
    donorCount: campaign.donorCount || 0,
    deadline: campaign.deadline.toISOString(),
    progressPercent:
      campaign.raisedIdr && campaign.targetIdr
        ? Math.min(100, Math.round((campaign.raisedIdr / campaign.targetIdr) * 100))
        : 0,
    coverImage,
    createdAt: campaign.createdAt.toISOString(),
  };
}

/**
 * Build campaign detail DTO with all asset images grouped by kind
 */
export async function mapCampaignToDetail(
  campaign: Campaign,
  worshipPlace: WorshipPlace,
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
  type ImageData = {
    assetId: string;
    publicUrl: string;
    storageKey: string;
    caption?: string;
  };

  type ImagesByKind = {
    cover: ImageData | null;
    gallery: ImageData[];
    transparency: ImageData[];
    installation: ImageData[];
  };

  const imagesByKind: ImagesByKind = {
    cover: null,
    gallery: [],
    transparency: [],
    installation: [],
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
    } else if (
      record.kind === "gallery" ||
      record.kind === "transparency" ||
      record.kind === "installation"
    ) {
      imagesByKind[record.kind].push(imageData);
    }
  }

  return {
    id: campaign.id,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    targetIdr: campaign.targetIdr,
    raisedIdr: campaign.raisedIdr || 0,
    donorCount: campaign.donorCount || 0,
    deadline: campaign.deadline.toISOString(),
    progressPercent:
      campaign.raisedIdr && campaign.targetIdr
        ? Math.min(100, Math.round((campaign.raisedIdr / campaign.targetIdr) * 100))
        : 0,
    worshipPlace: {
      name: worshipPlace.name,
      city: worshipPlace.city,
      religionType: worshipPlace.religionType,
      address: worshipPlace.address,
    },
    energyImpact: {
      panelCapacityKwp: campaign.panelCapacityKwp,
      estimatedKwhAnnual: campaign.estimatedKwhAnnual ?? undefined,
      estimatedIdrSavings: campaign.estimatedIdrSavings ?? undefined,
    },
    impact: {
      fundUsage: campaign.fundUsage ?? undefined,
      energyProducedKwhMonthly: campaign.energyProducedKwhMonthly ?? undefined,
      beneficiaries: campaign.beneficiaries ?? undefined,
      carbonReductionKgMonthly: campaign.carbonReductionKgMonthly ?? undefined,
      electricitySavingsIdrMonthly: campaign.electricitySavingsIdrMonthly ?? undefined,
      impactDescription: campaign.impactDescription ?? undefined,
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

/**
 * Build campaign summary DTO for quick layout binding
 */
export async function mapCampaignToSummary(
  campaign: Campaign,
): Promise<z.infer<typeof campaignSummarySchema>> {
  return {
    id: campaign.id,
    title: campaign.title,
    targetIdr: Number(campaign.targetIdr),
    raisedIdr: Number(campaign.raisedIdr),
    donorCount: campaign.donorCount || 0,
  };
}
