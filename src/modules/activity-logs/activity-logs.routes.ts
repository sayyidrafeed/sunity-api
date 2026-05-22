import { Router } from "express";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  activityLogListResponseSchema,
  campaignIdParamSchema,
  listActivityLogsQuerySchema,
} from "./activity-logs.schema.js";
import * as handlers from "./activity-logs.handlers.js";

export const activityLogsRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/campaigns/{id}/activities",
  tags: ["Admin Activity Logs"],
  summary: "List campaign activity logs",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    query: listActivityLogsQuerySchema,
  },
  responses: {
    200: {
      description: "List of activity logs",
      content: { "application/json": { schema: activityLogListResponseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

activityLogsRouter.get(
  "/campaigns/:id/activities",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateQuery(listActivityLogsQuerySchema),
  handlers.getCampaignActivities,
);
