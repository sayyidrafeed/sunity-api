import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { energyData } from "../../db/schema/energy.schema.js";

const energySelectSchema = createSelectSchema(energyData);

export const energySchema = energySelectSchema
  .pick({
    id: true,
    campaignId: true,
    month: true,
    kwhProduced: true,
    idrSaved: true,
    kgCo2Reduced: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("Energy");

export const createEnergySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Must be in YYYY-MM format"),
  kwhProduced: z.number().min(0, "kWh produced must be >= 0"),
  idrSaved: z.number().int().min(0, "IDR saved must be >= 0"),
  kgCo2Reduced: z.number().min(0, "kg CO2 reduced must be >= 0"),
});

export const updateEnergySchema = createEnergySchema.partial();

export const uploadEnergyCsvSchema = z.object({
  file: z.unknown(),
});

export const energyCsvRowSchema = z.object({
  month: z.string().length(7),
  kwh_produced: z.coerce.number().min(0),
  idr_saved: z.coerce.number().int().min(0),
  kg_co2_reduced: z.coerce.number().min(0),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const energyMonthParamSchema = z.object({
  id: z.string().uuid(),
  month: z.string().length(7),
});

export const listEnergyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

export const energySummarySchema = z.object({
  totalKwhProduced: z.number(),
  totalIdrSaved: z.number(),
  totalKgCo2Reduced: z.number(),
});

export const energyListResponseSchema = z.object({
  summary: energySummarySchema,
  data: z.array(energySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export const successResponseSchema = z.object({
  success: z.literal(true),
});
