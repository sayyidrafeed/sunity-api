import { Router } from "express";
import { requireSession, requirePermission } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  updateStatusSchema,
  publishSchema,
  listCampaignAdminQuerySchema,
  campaignIdParamSchema,
  campaignListResponseSchema,
  attachAssetSchema,
  attachAssetResponseSchema,
  successResponseSchema,
} from "./campaigns.schema.js";
import * as handlers from "./campaigns.handlers.js";

export const adminCampaignsRouter = Router();

// GET /api/admin/campaigns - List all campaigns (admin only)
registry.registerPath({
  method: "get",
  path: "/admin/campaigns",
  tags: ["Admin Campaigns"],
  summary: "List all campaigns including unpublished (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    query: listCampaignAdminQuerySchema,
  },
  responses: {
    200: {
      description: "List of campaigns with optional unpublished filter",
      content: { "application/json": { schema: campaignListResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.get(
  "/",
  requireSession,
  requirePermission(["admin"]),
  validateQuery(listCampaignAdminQuerySchema),
  handlers.getListCampaignsAdmin,
);

// PATCH /api/admin/campaigns/:id/status - Update campaign status
registry.registerPath({
  method: "patch",
  path: "/admin/campaigns/{id}/status",
  tags: ["Admin Campaigns"],
  summary: "Update campaign status (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: updateStatusSchema } } },
  },
  responses: {
    200: {
      description: "Campaign status updated",
      content: { "application/json": { schema: campaignIdParamSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.patch(
  "/:id/status",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(updateStatusSchema),
  handlers.patchUpdateStatus,
);

// PATCH /api/admin/campaigns/:id/publish - Publish campaign
registry.registerPath({
  method: "patch",
  path: "/admin/campaigns/{id}/publish",
  tags: ["Admin Campaigns"],
  summary: "Publish campaign (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: publishSchema } } },
  },
  responses: {
    200: {
      description: "Campaign published",
      content: { "application/json": { schema: campaignIdParamSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.patch(
  "/:id/publish",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(publishSchema),
  handlers.patchPublishCampaign,
);

// DELETE /api/admin/campaigns/:id - Delete campaign
registry.registerPath({
  method: "delete",
  path: "/admin/campaigns/{id}",
  tags: ["Admin Campaigns"],
  summary: "Delete campaign (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
  },
  responses: {
    200: {
      description: "Campaign deleted",
      content: { "application/json": { schema: successResponseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.delete(
  "/:id",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  handlers.deleteCampaign,
);

// POST /api/admin/campaigns/:id/assets - Attach asset to campaign
registry.registerPath({
  method: "post",
  path: "/admin/campaigns/{id}/assets",
  tags: ["Admin Campaigns"],
  summary: "Attach asset to campaign (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: attachAssetSchema } } },
  },
  responses: {
    201: {
      description: "Asset attached to campaign",
      content: { "application/json": { schema: attachAssetResponseSchema } },
    },
    404: {
      description: "Campaign or asset not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.post(
  "/:id/assets",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(attachAssetSchema),
  handlers.postAttachAsset,
);
