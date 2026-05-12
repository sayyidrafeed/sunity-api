import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { worshipPlaces } from "../../db/schema/index.js";

const worshipPlaceSelectSchema = createSelectSchema(worshipPlaces);

export const worshipPlaceSchema = worshipPlaceSelectSchema
  .pick({
    id: true,
    name: true,
    religionType: true,
    address: true,
    city: true,
    contactPerson: true,
    contactPhone: true,
    currentCondition: true,
    personInCharge: true,
    thumbnailAssetId: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("WorshipPlace");

export const createWorshipPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  religionType: z.enum(["Masjid", "Mushalla", "Gereja", "Pura", "Vihara", "Klenteng"]),
  address: z.string().min(1).max(500),
  city: z.string().min(1),
  contactPerson: z.string().optional(),
  contactPhone: z
    .string()
    .regex(/^(\+62|08)\d{8,13}$/)
    .optional(),
  currentCondition: z.string().optional(),
  personInCharge: z.string().optional(),
  thumbnailAssetId: z.string().uuid().optional(),
});

export const updateWorshipPlaceSchema = createWorshipPlaceSchema.partial();

export const worshipPlaceIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listWorshipPlacesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
  search: z.string().optional(),
  city: z.string().optional(),
});

export const worshipPlaceListResponseSchema = z.object({
  data: z.array(worshipPlaceSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});
