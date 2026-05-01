import { Router } from "express";
import { requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../lib/validate.js";
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
} from "./campaigns.schema.js";
import * as handlers from "./campaigns.handlers.js";

export const campaignsRouter = Router();
const paramsSchema = require("zod").z.object({ id: require("zod").z.string() });

campaignsRouter.get("/", validateQuery(listCampaignQuerySchema), handlers.getListCampaigns);

campaignsRouter.get("/:id", validateParams(paramsSchema), handlers.getCampaignById);

campaignsRouter.post(
  "/",
  requireSession,
  validateBody(createCampaignSchema),
  handlers.postCreateCampaign,
);

campaignsRouter.patch(
  "/:id",
  requireSession,
  validateBody(updateCampaignSchema),
  handlers.patchUpdateCampaign,
);

campaignsRouter.patch(
  "/:id/status",
  requireSession,
  validateBody(updateStatusSchema),
  handlers.patchUpdateStatus,
);

campaignsRouter.patch(
  "/:id/publish",
  requireSession,
  validateBody(publishSchema),
  handlers.patchPublishCampaign,
);

campaignsRouter.delete("/:id", requireSession, handlers.deleteCampaign);
