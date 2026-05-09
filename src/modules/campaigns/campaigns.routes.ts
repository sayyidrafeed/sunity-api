import { Router } from "express";
import { requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  listCampaignQuerySchema,
  campaignIdParamSchema,
  campaignListResponseSchema,
  campaignDetailSchema,
} from "./campaigns.schema.js";
import * as handlers from "./campaigns.handlers.js";

export const campaignsRouter = Router();

// GET /api/campaigns - List all public campaigns
registry.registerPath({
  method: "get",
  path: "/campaigns",
  tags: ["Campaigns"],
  summary: "List all public campaigns with assets",
  request: {
    query: listCampaignQuerySchema,
  },
  responses: {
    200: {
      description: "List of public campaigns with cover images and pagination",
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
