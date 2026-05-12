import { Router } from "express";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  createWorshipPlaceSchema,
  listWorshipPlacesQuerySchema,
  updateWorshipPlaceSchema,
  worshipPlaceIdParamSchema,
  worshipPlaceListResponseSchema,
  worshipPlaceSchema,
} from "./worship-places.schema.js";
import * as handlers from "./worship-places.handlers.js";

export const worshipPlacesRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/worship-places",
  tags: ["Admin Worship Places"],
  summary: "List worship places",
  security: [{ bearerAuth: [] }],
  request: {
    query: listWorshipPlacesQuerySchema,
  },
  responses: {
    200: {
      description: "List of worship places",
      content: { "application/json": { schema: worshipPlaceListResponseSchema } },
    },
  },
});

worshipPlacesRouter.get(
  "/",
  requireSession,
  requirePermission(["admin"]),
  validateQuery(listWorshipPlacesQuerySchema),
  handlers.getListWorshipPlaces,
);

registry.registerPath({
  method: "post",
  path: "/admin/worship-places",
  tags: ["Admin Worship Places"],
  summary: "Create worship place",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createWorshipPlaceSchema } } },
  },
  responses: {
    201: {
      description: "Worship place created",
      content: { "application/json": { schema: worshipPlaceSchema } },
    },
  },
});

worshipPlacesRouter.post(
  "/",
  requireSession,
  requirePermission(["admin"]),
  validateBody(createWorshipPlaceSchema),
  handlers.postCreateWorshipPlace,
);

registry.registerPath({
  method: "get",
  path: "/admin/worship-places/{id}",
  tags: ["Admin Worship Places"],
  summary: "Get worship place by id",
  security: [{ bearerAuth: [] }],
  request: {
    params: worshipPlaceIdParamSchema,
  },
  responses: {
    200: {
      description: "Worship place",
      content: { "application/json": { schema: worshipPlaceSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

worshipPlacesRouter.get(
  "/:id",
  requireSession,
  requirePermission(["admin"]),
  validateParams(worshipPlaceIdParamSchema),
  handlers.getWorshipPlaceById,
);

registry.registerPath({
  method: "patch",
  path: "/admin/worship-places/{id}",
  tags: ["Admin Worship Places"],
  summary: "Update worship place",
  security: [{ bearerAuth: [] }],
  request: {
    params: worshipPlaceIdParamSchema,
    body: { content: { "application/json": { schema: updateWorshipPlaceSchema } } },
  },
  responses: {
    200: {
      description: "Worship place updated",
      content: { "application/json": { schema: worshipPlaceSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

worshipPlacesRouter.patch(
  "/:id",
  requireSession,
  requirePermission(["admin"]),
  validateParams(worshipPlaceIdParamSchema),
  validateBody(updateWorshipPlaceSchema),
  handlers.patchUpdateWorshipPlace,
);
