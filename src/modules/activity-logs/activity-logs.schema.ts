import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { activityLogs } from "../../db/schema/index.js";

const activityLogSelectSchema = createSelectSchema(activityLogs);

export const activityLogSchema = activityLogSelectSchema
  .pick({
    id: true,
    campaignId: true,
    actorId: true,
    action: true,
    entityType: true,
    entityId: true,
    metadata: true,
    createdAt: true,
  })
  .openapi("ActivityLog");

export const listActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const activityLogListResponseSchema = z.object({
  data: z.array(activityLogSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export const logActivitySchema = z.object({
  campaignId: z.string().uuid().nullable().optional(),
  actorId: z.string().min(1),
  action: z.string().min(1),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
