import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  targetIdr: z.number().int().positive().min(100_000).max(100_000_000_000),
  panelCapacityKwp: z.string(),
  estimatedKwhAnnual: z.string().optional(),
  estimatedIdrSavings: z.number().int().positive().optional(),
  coverImageUrl: z.string().url().optional(),
  deadline: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Deadline must be in the future",
    }),
  worshipPlaceId: z.string().uuid(),
  fundUsage: z.string().optional(),
  energyProducedKwhMonthly: z.string().optional(),
  beneficiaries: z.number().int().positive().optional(),
  carbonReductionKgMonthly: z.string().optional(),
  electricitySavingsIdrMonthly: z.number().int().positive().optional(),
  impactDescription: z.string().optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "AKTIF", "INSTALASI", "SELESAI", "ARCHIVED"]),
});

export const publishSchema = z.object({
  isPublished: z.boolean(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
  search: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(["Masjid", "Mushalla", "Gereja", "Pura", "Vihara", "Klenteng"]).optional(),
  status: z.enum(["DRAFT", "AKTIF", "INSTALASI", "SELESAI", "ARCHIVED"]).optional(),
  sortBy: z.enum(["createdAt", "deadline", "raisedProgress", "targetIdr"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listCampaignAdminQuerySchema = listCampaignQuerySchema.extend({
  includeUnpublished: z.coerce.boolean().default(false),
});

// Asset DTOs for responses
const assetImageSchema = z.object({
  assetId: z.string().uuid(),
  publicUrl: z.string().url(),
  storageKey: z.string(),
});

const assetImageWithCaptionSchema = assetImageSchema.extend({
  caption: z.string().optional(),
});

// Campaign card for list view
export const campaignCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  worshipPlace: z.object({
    name: z.string(),
    city: z.string(),
    religionType: z.string(),
  }),
  status: z.string(),
  targetIdr: z.number(),
  raisedIdr: z.number(),
  donorCount: z.number(),
  deadline: z.string().datetime(),
  progressPercent: z.number(),
  coverImage: assetImageSchema.nullable().optional(),
});

export const campaignListResponseSchema = z.object({
  data: z.array(campaignCardSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
  filters: z
    .object({
      cities: z.array(z.string()).optional(),
      types: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
    })
    .optional(),
});

// Campaign detail for detail view
export const campaignDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  targetIdr: z.number(),
  raisedIdr: z.number(),
  donorCount: z.number(),
  deadline: z.string().datetime(),
  progressPercent: z.number(),
  worshipPlace: z.object({
    name: z.string(),
    city: z.string(),
    religionType: z.string(),
  }),
  energyImpact: z.object({
    panelCapacityKwp: z.string(),
    estimatedKwhAnnual: z.string().optional(),
    estimatedIdrSavings: z.number().optional(),
  }),
  impact: z.object({
    fundUsage: z.string().optional(),
    energyProducedKwhMonthly: z.string().optional(),
    beneficiaries: z.number().optional(),
    carbonReductionKgMonthly: z.string().optional(),
    electricitySavingsIdrMonthly: z.number().optional(),
    impactDescription: z.string().optional(),
  }),
  images: z
    .object({
      cover: assetImageSchema.nullable().optional(),
      gallery: z.array(assetImageWithCaptionSchema).default([]),
      transparency: z.array(assetImageWithCaptionSchema).default([]),
      installation: z.array(assetImageWithCaptionSchema).default([]),
    })
    .optional(),
  published: z.boolean(),
});

// Attach asset to campaign
export const attachAssetSchema = z.object({
  assetId: z.string().uuid(),
  kind: z.enum(["cover", "gallery", "transparency", "installation", "report"]),
  sortOrder: z.number().int().nonnegative(),
  caption: z.string().optional(),
});

export const attachAssetResponseSchema = z.object({
  success: z.boolean(),
});

export const successResponseSchema = z.object({
  success: z.literal(true),
});
