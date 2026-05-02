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
  try {
    const body = req.validatedBody as z.infer<typeof createCampaignSchema>;
    const userId = req.session!.user.id;

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

    const result = await service.listCampaigns({
      page: query.page,
      limit: query.limit ?? 12,
      search: query.search,
      city: query.city,
      type: query.type,
      status: query.status,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCampaignByFilters(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as {
      title: string;
      city: string;
    };
    const campaign = await service.getCampaignByFilters(query);
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
    const query = req.validatedQuery as {
      title: string;
      city: string;
    };
    const body = req.validatedBody as z.infer<typeof updateCampaignSchema>;
    const campaign = await service.updateCampaign(query, body);
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
    const query = req.validatedQuery as {
      title: string;
      city: string;
    };
    const body = req.validatedBody as z.infer<typeof updateStatusSchema>;
    const campaign = await service.updateCampaignStatus(query, body);
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
    const query = req.validatedQuery as {
      title: string;
      city: string;
    };
    const body = req.validatedBody as z.infer<typeof publishSchema>;
    const campaign = await service.publishCampaign(query, body);
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
    const query = req.validatedQuery as {
      title: string;
      city: string;
    };
    await service.deleteCampaign(query);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
