import { Router } from "express";
import { requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateQuery } from "../../lib/validate.js";
import {
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
  campaignKeySchema,
} from "./campaigns.schema.js";
import * as handlers from "./campaigns.handlers.js";

export const campaignsRouter = Router();

campaignsRouter.get("/", validateQuery(listCampaignQuerySchema), handlers.getListCampaigns);

campaignsRouter.get("/detail", validateQuery(campaignKeySchema), handlers.getCampaignByFilters);

campaignsRouter.patch(
  "/",
  requireSession,
  validateQuery(campaignKeySchema),
  validateBody(updateCampaignSchema),
  handlers.patchUpdateCampaign,
);

campaignsRouter.patch(
  "/status",
  requireSession,
  validateQuery(campaignKeySchema),
  validateBody(updateStatusSchema),
  handlers.patchUpdateStatus,
);

campaignsRouter.patch(
  "/publish",
  requireSession,
  validateQuery(campaignKeySchema),
  validateBody(publishSchema),
  handlers.patchPublishCampaign,
);

campaignsRouter.delete(
  "/",
  requireSession,
  validateQuery(campaignKeySchema),
  handlers.deleteCampaign,
);
