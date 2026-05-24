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
  campaignDetailSchema,
  attachAssetSchema,
  attachAssetResponseSchema,
  successResponseSchema,
  createCampaignSchema,
  campaignCreatedResponseSchema,
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
  requirePermission("admin", ["read", "write"]),
  validateQuery(listCampaignAdminQuerySchema),
  handlers.getListCampaignsAdmin,
);

// GET /api/admin/campaigns/:id - Get campaign detail (admin only)
registry.registerPath({
  method: "get",
  path: "/admin/campaigns/{id}",
  tags: ["Admin Campaigns"],
  summary: "Get campaign details (admin only)",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
  },
  responses: {
    200: {
      description: "Campaign details",
      content: { "application/json": { schema: campaignDetailSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.get(
  "/:id",
  requireSession,
  requirePermission("admin", ["read", "write"]),
  validateParams(campaignIdParamSchema),
  handlers.getCampaignById,
);

// POST /api/admin/campaigns - Create campaign (admin)
registry.registerPath({
  method: "post",
  path: "/admin/campaigns",
  tags: ["Admin Campaigns"],
  summary: "Create a new campaign (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createCampaignSchema } } },
  },
  responses: {
    201: {
      description: "Campaign created",
      content: { "application/json": { schema: campaignCreatedResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminCampaignsRouter.post(
  "/",
  requireSession,
  requirePermission("admin", ["read", "write"]),
  validateBody(createCampaignSchema),
  handlers.postCreateCampaign,
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
  requirePermission("admin", ["read", "write"]),
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
  requirePermission("admin", ["read", "write"]),
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
  requirePermission("admin", ["read", "write"]),
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
  requirePermission("admin", ["read", "write"]),
  validateParams(campaignIdParamSchema),
  validateBody(attachAssetSchema),
  handlers.postAttachAsset,
);
