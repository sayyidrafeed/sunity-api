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

export const campaignKeySchema = z.object({
  title: z.string().min(1),
  city: z.string().min(1),
});

export const listCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
  search: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(["Masjid", "Mushalla", "Gereja", "Pura", "Vihara", "Klenteng"]).optional(),
  status: z.enum(["Aktif", "Instalasi", "Selesai"]).optional(),
});
