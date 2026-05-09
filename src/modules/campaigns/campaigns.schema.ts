import { z } from "zod";

export const createCampaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  targetIdr: z.string(),
  panelCapacityKwp: z.string(),
  estimatedKwhAnnual: z.string().optional(),
  estimatedIdrSavings: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  deadline: z.string().datetime(),
  worshipPlaceName: z.string().min(1),
  city: z.string().min(1),
  religionType: z.enum(["Masjid", "Mushalla", "Gereja", "Pura", "Vihara", "Klenteng"]),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["Aktif", "Instalasi", "Selesai"]),
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
  status: z.enum(["Aktif", "Instalasi", "Selesai"]).optional(),
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
  city: z.string(),
  religionType: z.string(),
  status: z.string(),
  targetIdr: z.string(),
  raisedIdr: z.string(),
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
  targetIdr: z.string(),
  raisedIdr: z.string(),
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
    estimatedIdrSavings: z.string().optional(),
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
