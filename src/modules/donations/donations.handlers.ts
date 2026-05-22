import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import * as service from "./donations.service.js";
import type {
  campaignIdParamSchema,
  createDonationSchema,
  listDonationsQuerySchema,
  midtransWebhookPayloadSchema,
} from "./donations.schema.js";

export async function postInitiateDonation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof createDonationSchema>;
    const result = await service.initiateDonationRecord(params.id, body);

    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof service.DonationCampaignNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function getDonationList(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const query = req.validatedQuery as z.infer<typeof listDonationsQuerySchema>;
    const result = await service.getCampaignDonations(params.id, query);

    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  } catch (error) {
    if (error instanceof service.DonationCampaignNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function postMidtransWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validatedBody as z.infer<typeof midtransWebhookPayloadSchema>;

    await service.processMidtransWebhook(body);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof service.InvalidSignatureError) {
      res.status(403).json({ error: error.message });
      return;
    }
    if (error instanceof service.DonationNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}
