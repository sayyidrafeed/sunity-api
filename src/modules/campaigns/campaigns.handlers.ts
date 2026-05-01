import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import * as service from "./campaigns.service.js";
import type {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
} from "./campaigns.schema.js";

export async function postCreateCampaign(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const body = req.validatedBody as z.infer<typeof createCampaignSchema>;
  const userId = req.session!.user.id;
  try {
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
  const query = req.validatedQuery as z.infer<typeof listCampaignQuerySchema>;
  try {
    const result = await service.listCampaigns(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCampaignById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.validatedParams as { id: string };
    const campaign = await service.getCampaignById(id);
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
    const { id } = req.validatedParams as { id: string };
    const body = req.validatedBody as z.infer<typeof updateCampaignSchema>;
    const campaign = await service.updateCampaign(id, body);
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
    const { id } = req.validatedParams as { id: string };
    const body = req.validatedBody as z.infer<typeof updateStatusSchema>;
    const campaign = await service.updateCampaignStatus(id, body);
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
    const { id } = req.validatedParams as { id: string };
    const body = req.validatedBody as z.infer<typeof publishSchema>;
    const campaign = await service.publishCampaign(id, body);
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
    const { id } = req.validatedParams as { id: string };
    await service.deleteCampaign(id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
