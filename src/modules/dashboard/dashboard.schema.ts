import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { campaigns } from "../../db/schema/index.js";
import "../../lib/schemas.js"; // Ensures Zod is extended with OpenAPI metadata support

const campaignSelectSchema = createSelectSchema(campaigns);

const dashboardCampaignSchema = campaignSelectSchema
  .pick({
    id: true,
    title: true,
    status: true,
  })
  .extend({
    deadline: z.string().datetime(),
  });

export const adminDashboardQuerySchema = z.object({
  campaignId: z.string().uuid({ message: "campaignId must be a valid UUID" }),
});

export const dashboardStatsSchema = z.object({
  donorCount: z.number().int().nonnegative(),
  donorCountToday: z.number().int().nonnegative(),
  daysRemaining: z.number().int().nonnegative(),
  campaignStatus: z.string(),
});

export const dashboardDonationSchema = z.object({
  raisedIdr: z.number().int().nonnegative(),
  targetIdr: z.number().int().nonnegative(),
  progressPercent: z.number().int().nonnegative().max(100),
});

export const dashboardEnergyImpactSchema = z.object({
  totalEnergyKwh: z.string(),
  averageEnergyPerDayKwh: z.string(),
  carbonReductionTon: z.string(),
  costSavingsIdrMonthly: z.string(),
  carbonReductionMomPercent: z.number().int(),
});

export const dashboardRecentDonationSchema = z.object({
  id: z.string().uuid(),
  donorName: z.string(),
  amount: z.number().int().positive(),
  date: z.string().datetime(),
  method: z.string(),
});

export const adminDashboardResponseDataSchema = z.object({
  campaign: dashboardCampaignSchema,
  stats: dashboardStatsSchema,
  donation: dashboardDonationSchema,
  energyImpact: dashboardEnergyImpactSchema.optional(),
  recentDonations: z.array(dashboardRecentDonationSchema),
});

export const adminDashboardResponseSchema =
  adminDashboardResponseDataSchema.openapi("AdminDashboardResponse");
