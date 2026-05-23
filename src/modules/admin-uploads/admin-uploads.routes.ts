import { Router } from "express";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateBody } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  adminAssetUploadSessionResponseSchema,
  createAdminAssetUploadSessionSchema,
} from "./admin-uploads.schema.js";
import { postCreateAdminAssetUploadSession } from "./admin-uploads.handlers.js";

export const adminUploadsRouter = Router();

registry.registerPath({
  method: "post",
  path: "/admin/uploads/presign",
  tags: ["Admin Uploads"],
  summary: "Create presigned upload session (admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createAdminAssetUploadSessionSchema } } },
  },
  responses: {
    201: {
      description: "Upload session created",
      content: { "application/json": { schema: adminAssetUploadSessionResponseSchema } },
    },
    400: {
      description: "Invalid asset input",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

adminUploadsRouter.post(
  "/uploads/presign",
  requireSession,
  requirePermission("admin", ["read", "write"]),
  validateBody(createAdminAssetUploadSessionSchema),
  postCreateAdminAssetUploadSession,
);
