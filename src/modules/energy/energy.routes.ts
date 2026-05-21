import { Router } from "express";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  campaignIdParamSchema,
  energyMonthParamSchema,
  createEnergySchema,
  energyListResponseSchema,
  energySchema,
  listEnergyQuerySchema,
  updateEnergySchema,
  successResponseSchema,
} from "./energy.schema.js";
import * as handlers from "./energy.handlers.js";

export const energyRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/campaigns/{id}/energy",
  tags: ["Admin Energy"],
  summary: "List campaign energy data",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    query: listEnergyQuerySchema,
  },
  responses: {
    200: {
      description: "List of energy records",
      content: { "application/json": { schema: energyListResponseSchema } },
    },
    403: {
      description: "Dashboard not available",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

energyRouter.get(
  "/campaigns/:id/energy",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateQuery(listEnergyQuerySchema),
  handlers.getEnergyData,
);

registry.registerPath({
  method: "post",
  path: "/admin/campaigns/{id}/energy",
  tags: ["Admin Energy"],
  summary: "Create campaign energy record",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: createEnergySchema } } },
  },
  responses: {
    201: {
      description: "Energy record created",
      content: { "application/json": { schema: energySchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
    409: {
      description: "Record already exists for this month",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

energyRouter.post(
  "/campaigns/:id/energy",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(createEnergySchema),
  handlers.postCreateEnergy,
);

registry.registerPath({
  method: "put",
  path: "/admin/campaigns/{id}/energy",
  tags: ["Admin Energy"],
  summary: "Overwrite campaign energy record",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: createEnergySchema } } },
  },
  responses: {
    200: {
      description: "Energy record overwritten",
      content: { "application/json": { schema: energySchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

energyRouter.put(
  "/campaigns/:id/energy",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(createEnergySchema),
  handlers.putOverwriteEnergy,
);

registry.registerPath({
  method: "patch",
  path: "/admin/campaigns/{id}/energy/{month}",
  tags: ["Admin Energy"],
  summary: "Update energy record",
  security: [{ bearerAuth: [] }],
  request: {
    params: energyMonthParamSchema,
    body: { content: { "application/json": { schema: updateEnergySchema } } },
  },
  responses: {
    200: {
      description: "Energy record updated",
      content: { "application/json": { schema: energySchema } },
    },
    404: {
      description: "Record not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

energyRouter.patch(
  "/campaigns/:id/energy/:month",
  requireSession,
  requirePermission(["admin"]),
  validateParams(energyMonthParamSchema),
  validateBody(updateEnergySchema),
  handlers.patchUpdateEnergy,
);

registry.registerPath({
  method: "delete",
  path: "/admin/campaigns/{id}/energy/{month}",
  tags: ["Admin Energy"],
  summary: "Delete energy record",
  security: [{ bearerAuth: [] }],
  request: {
    params: energyMonthParamSchema,
  },
  responses: {
    200: {
      description: "Energy record deleted",
      content: { "application/json": { schema: successResponseSchema } },
    },
    404: {
      description: "Record not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

energyRouter.delete(
  "/campaigns/:id/energy/:month",
  requireSession,
  requirePermission(["admin"]),
  validateParams(energyMonthParamSchema),
  handlers.deleteEnergyHandler,
);
