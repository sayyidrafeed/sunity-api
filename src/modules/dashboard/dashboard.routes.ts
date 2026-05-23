import { Router } from "express";
import { requireSession, requirePermission } from "../../middleware/auth.middleware.js";
import { validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import { adminDashboardQuerySchema, adminDashboardResponseSchema } from "./dashboard.schema.js";
import * as handlers from "./dashboard.handlers.js";

export const dashboardRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/dashboard",
  tags: ["Admin Dashboard"],
  summary: "Get admin dashboard summary",
  description: "Returns aggregated metrics and recent data for a specific campaign",
  operationId: "getAdminDashboard",
  security: [{ bearerAuth: [] }],
  request: {
    query: adminDashboardQuerySchema,
  },
  responses: {
    200: {
      description: "Dashboard data",
      content: { "application/json": { schema: adminDashboardResponseSchema } },
    },
    400: {
      description: "Bad Request",
      content: { "application/json": { schema: errorSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

dashboardRouter.get(
  "/",
  requireSession,
  requirePermission("dashboard", ["read"]),
  validateQuery(adminDashboardQuerySchema),
  handlers.getAdminDashboardHandler,
);
