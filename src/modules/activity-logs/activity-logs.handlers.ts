import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import * as service from "./activity-logs.service.js";
import type { campaignIdParamSchema, listActivityLogsQuerySchema } from "./activity-logs.schema.js";

export async function getCampaignActivities(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const query = req.validatedQuery as z.infer<typeof listActivityLogsQuerySchema>;
    const result = await service.listActivityLogs(params.id, query);
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}
