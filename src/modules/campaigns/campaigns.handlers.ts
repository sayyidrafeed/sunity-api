import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import * as service from "./campaigns.service.js";
import { logActivity } from "../activity-logs/activity-logs.service.js";
import type {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
  listCampaignAdminQuerySchema,
  campaignIdParamSchema,
  attachAssetSchema,
} from "./campaigns.schema.js";

export async function postCreateCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.session?.user?.id) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const body = req.validatedBody as z.infer<typeof createCampaignSchema>;
    const userId = req.session.user.id;

    const campaign = await service.createCampaign(userId, body);
    res.status(201).json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function getListCampaigns(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as z.infer<typeof listCampaignQuerySchema>;

    const result = await service.listCampaignsPublic({
      page: query.page,
      limit: query.limit ?? 12,
      search: query.search,
      city: query.city,
      type: query.type,
      status: query.status,
      sortBy: query.sortBy,
      order: query.order,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getListCampaignsAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as z.infer<typeof listCampaignAdminQuerySchema>;

    const result = await service.listCampaignsAdmin({
      page: query.page,
      limit: query.limit ?? 12,
      search: query.search,
      city: query.city,
      type: query.type,
      status: query.status,
      sortBy: query.sortBy,
      order: query.order,
      includeUnpublished: query.includeUnpublished,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCampaignById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const campaign = await service.getCampaignDetail(params.id);
    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function patchUpdateCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof updateCampaignSchema>;
    const campaign = await service.updateCampaign(params.id, body);
    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function patchUpdateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof updateStatusSchema>;
    const campaign = await service.updateCampaignStatus(params.id, body);
    if (req.session?.user?.id) {
      await logActivity({
        campaignId: campaign.id,
        actorId: req.session.user.id,
        action: "STATUS_CHANGED",
        entityType: "campaign",
        entityId: campaign.id,
        metadata: { to: body.status },
      });
    }
    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function patchPublishCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof publishSchema>;
    const campaign = await service.publishCampaign(params.id, body);
    if (req.session?.user?.id) {
      await logActivity({
        campaignId: campaign.id,
        actorId: req.session.user.id,
        action: body.isPublished ? "PUBLISHED" : "UNPUBLISHED",
        entityType: "campaign",
        entityId: campaign.id,
      });
    }
    res.json({ data: campaign });
  } catch (error) {
    next(error);
  }
}

export async function deleteCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    await service.deleteCampaign(params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function postAttachAsset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof attachAssetSchema>;

    await service.attachAssetToCampaign(params.id, body);
    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
}
