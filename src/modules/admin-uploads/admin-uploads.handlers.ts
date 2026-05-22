import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import {
  InvalidAdminAssetUploadError,
  createAdminAssetUploadSession,
} from "./admin-uploads.service.js";
import type { createAdminAssetUploadSessionSchema } from "./admin-uploads.schema.js";

export async function postCreateAdminAssetUploadSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validatedBody as z.infer<typeof createAdminAssetUploadSessionSchema>;

    const result = await createAdminAssetUploadSession(body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof InvalidAdminAssetUploadError) {
      res.status(400).json({ error: error.message });
      return;
    }

    next(error);
  }
}
