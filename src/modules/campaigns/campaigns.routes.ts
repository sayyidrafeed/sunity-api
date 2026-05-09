import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
  campaignIdParamSchema,
  campaignListResponseSchema,
  campaignDetailSchema,
} from "./campaigns.schema.js";
import * as handlers from "./campaigns.handlers.js";

export const campaignsRouter = Router();

// GET /api/campaigns - List all campaigns
registry.registerPath({
  method: "get",
  path: "/campaigns",
  tags: ["Campaigns"],
  summary: "List all campaigns with assets",
  request: {
    query: listCampaignQuerySchema,
  },
  responses: {
    200: {
      description: "List of campaigns with cover images and pagination",
      content: { "application/json": { schema: campaignListResponseSchema } },
    },
  },
});

campaignsRouter.get("/", validateQuery(listCampaignQuerySchema), handlers.getListCampaigns);

// GET /api/campaigns/:id - Get campaign by ID
registry.registerPath({
  method: "get",
  path: "/campaigns/{id}",
  tags: ["Campaigns"],
  summary: "Get campaign details with all assets",
  request: {
    params: campaignIdParamSchema,
  },
  responses: {
    200: {
      description: "Campaign details with images",
      content: { "application/json": { schema: campaignDetailSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

campaignsRouter.get("/:id", validateParams(campaignIdParamSchema), handlers.getCampaignById);

// POST /api/campaigns - Create campaign
registry.registerPath({
  method: "post",
  path: "/campaigns",
  tags: ["Campaigns"],
  summary: "Create a new campaign",
  request: {
    body: { content: { "application/json": { schema: createCampaignSchema } } },
  },
  responses: {
    201: {
      description: "Campaign created",
      content: { "application/json": { schema: campaignIdParamSchema } },
    },
  },
});

campaignsRouter.post(
  "/",
  requireSession,
  validateBody(createCampaignSchema),
  handlers.postCreateCampaign,
);

// PATCH /api/campaigns/:id - Update campaign
registry.registerPath({
  method: "patch",
  path: "/campaigns/{id}",
  tags: ["Campaigns"],
  summary: "Update campaign",
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: updateCampaignSchema } } },
  },
  responses: {
    200: {
      description: "Campaign updated",
      content: { "application/json": { schema: campaignIdParamSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

campaignsRouter.patch(
  "/:id",
  requireSession,
  validateParams(campaignIdParamSchema),
  validateBody(updateCampaignSchema),
  handlers.patchUpdateCampaign,
);

// PATCH /api/campaigns/:id/status - Update campaign status
registry.registerPath({
  method: "patch",
  path: "/campaigns/{id}/status",
  tags: ["Campaigns"],
  summary: "Update campaign status",
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

campaignsRouter.patch(
  "/:id/status",
  requireSession,
  validateParams(campaignIdParamSchema),
  validateBody(updateStatusSchema),
  handlers.patchUpdateStatus,
);

// PATCH /api/campaigns/:id/publish - Publish campaign
registry.registerPath({
  method: "patch",
  path: "/campaigns/{id}/publish",
  tags: ["Campaigns"],
  summary: "Publish campaign",
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

campaignsRouter.patch(
  "/:id/publish",
  requireSession,
  validateParams(campaignIdParamSchema),
  validateBody(publishSchema),
  handlers.patchPublishCampaign,
);

// DELETE /api/campaigns/:id - Delete campaign
registry.registerPath({
  method: "delete",
  path: "/campaigns/{id}",
  tags: ["Campaigns"],
  summary: "Delete campaign",
  request: {
    params: campaignIdParamSchema,
  },
  responses: {
    200: {
      description: "Campaign deleted",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

campaignsRouter.delete(
  "/:id",
  requireSession,
  validateParams(campaignIdParamSchema),
  handlers.deleteCampaign,
);

// POST /api/campaigns/:id/assets - Attach asset to campaign
const attachAssetSchema = z.object({
  assetId: z.string().uuid(),
  kind: z.enum(["cover", "gallery", "transparency", "installation", "report"]),
  sortOrder: z.number().int().nonnegative(),
  caption: z.string().optional(),
});

registry.registerPath({
  method: "post",
  path: "/campaigns/{id}/assets",
  tags: ["Campaigns"],
  summary: "Attach asset to campaign",
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: attachAssetSchema } } },
  },
  responses: {
    201: {
      description: "Asset attached to campaign",
      content: { "application/json": { schema: z.object({ success: z.boolean() }) } },
    },
    404: {
      description: "Campaign or asset not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

campaignsRouter.post(
  "/:id/assets",
  requireSession,
  validateParams(campaignIdParamSchema),
  validateBody(attachAssetSchema),
  handlers.postAttachAsset,
);
