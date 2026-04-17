import { Router } from "express";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { dashboardResponseSchema, sessionResponseSchema } from "./admin.schema.js";
import * as handlers from "./admin.handlers.js";

export const adminRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/session",
  tags: ["Admin"],
  summary: "Get current admin session",
  responses: {
    200: {
      description: "Active session",
      content: { "application/json": { schema: sessionResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminRouter.get("/session", requireSession, requirePermission(["admin"]), handlers.getSession);

registry.registerPath({
  method: "get",
  path: "/admin/dashboard",
  tags: ["Admin"],
  summary: "Admin dashboard",
  responses: {
    200: {
      description: "Dashboard data",
      content: { "application/json": { schema: dashboardResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminRouter.get("/dashboard", requireSession, requirePermission(["admin"]), handlers.getDashboard);
