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
  religionType: z.enum(["masjid", "gereja", "pura", "vihara", "klenteng"]),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(["fundraising", "installation_in_progress", "completed"]),
});

export const publishSchema = z.object({
  isPublished: z.boolean(),
});

export const listCampaignQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
  search: z.string().optional(),
  city: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});
