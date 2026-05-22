import { Router } from "express";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  campaignIdParamSchema,
  createDonationSchema,
  donationResponseSchema,
  listDonationsQuerySchema,
  donationListResponseSchema,
  successResponseSchema,
  midtransWebhookPayloadSchema,
} from "./donations.schema.js";
import * as handlers from "./donations.handlers.js";

export const donationsRouter = Router();

registry.registerPath({
  method: "post",
  path: "/campaigns/{id}/donations",
  tags: ["Donations"],
  summary: "Initiate a campaign donation via Midtrans Snap",
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: createDonationSchema } } },
  },
  responses: {
    201: {
      description: "Donation initiated successfully",
      content: { "application/json": { schema: donationResponseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

donationsRouter.post(
  "/campaigns/:id/donations",
  validateParams(campaignIdParamSchema),
  validateBody(createDonationSchema),
  handlers.postInitiateDonation,
);

registry.registerPath({
  method: "get",
  path: "/campaigns/{id}/donations",
  tags: ["Donations"],
  summary: "List successful public donations for a campaign",
  request: {
    params: campaignIdParamSchema,
    query: listDonationsQuerySchema,
  },
  responses: {
    200: {
      description: "List of successful donations",
      content: { "application/json": { schema: donationListResponseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

donationsRouter.get(
  "/campaigns/:id/donations",
  validateParams(campaignIdParamSchema),
  validateQuery(listDonationsQuerySchema),
  handlers.getDonationList,
);

registry.registerPath({
  method: "post",
  path: "/webhook/midtrans",
  tags: ["Webhooks"],
  summary: "Handle automated transaction status updates from Midtrans",
  request: {
    body: {
      content: {
        "application/json": { schema: midtransWebhookPayloadSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook processed successfully",
      content: { "application/json": { schema: successResponseSchema } },
    },
    403: {
      description: "Invalid signature",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "Order record not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

donationsRouter.post(
  "/webhook/midtrans",
  validateBody(midtransWebhookPayloadSchema),
  handlers.postMidtransWebhookHandler,
);
