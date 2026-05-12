import { Router } from "express";
import { validateBody } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import * as handlers from "./assets.handlers.js";
import {
  createAssetUploadSessionSchema,
  assetUploadSessionResponseSchema,
} from "./assets.schema.js";

export const assetsRouter = Router();

registry.registerPath({
  method: "post",
  path: "/assets/upload",
  tags: ["Assets"],
  summary: "Create asset upload session with signed R2 URL",
  request: {
    body: { content: { "application/json": { schema: createAssetUploadSessionSchema } } },
  },
  responses: {
    201: {
      description: "Upload session created",
      content: { "application/json": { schema: assetUploadSessionResponseSchema } },
    },
    400: {
      description: "Invalid asset input",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

assetsRouter.post(
  "/assets/upload",
  validateBody(createAssetUploadSessionSchema),
  handlers.postCreateAssetUploadSession,
);
