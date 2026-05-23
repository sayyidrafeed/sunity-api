import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { getAdminDashboard, CampaignNotFoundError } from "./dashboard.service.js";
import type { adminDashboardQuerySchema } from "./dashboard.schema.js";

export async function getAdminDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const query = req.validatedQuery as z.infer<typeof adminDashboardQuerySchema>;

  try {
    const data = await getAdminDashboard(query.campaignId);
    res.json(data);
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      res.status(404).json({
        error: {
          code: error.errorCode,
          message: error.userMessage,
        },
      });
      return;
    }
    next(error);
  }
}
