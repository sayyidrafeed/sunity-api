import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import * as service from "./assets.service.js";
import { InvalidAssetError } from "./assets.service.js";
import type { createAssetUploadSessionSchema } from "./assets.schema.js";

export async function postCreateAssetUploadSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validatedBody as z.infer<typeof createAssetUploadSessionSchema>;

    const result = await service.createAssetUploadSession(body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof InvalidAssetError) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
}
