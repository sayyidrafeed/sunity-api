import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import * as service from "./worship-places.service.js";
import type {
  createWorshipPlaceSchema,
  listWorshipPlacesQuerySchema,
  updateWorshipPlaceSchema,
  worshipPlaceIdParamSchema,
} from "./worship-places.schema.js";

export async function getListWorshipPlaces(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as z.infer<typeof listWorshipPlacesQuerySchema>;
    const result = await service.listWorshipPlaces(query);
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function postCreateWorshipPlace(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.validatedBody as z.infer<typeof createWorshipPlaceSchema>;
    const place = await service.createWorshipPlace(body);
    res.status(201).json({ data: place });
  } catch (error) {
    next(error);
  }
}

export async function getWorshipPlaceById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof worshipPlaceIdParamSchema>;
    const place = await service.getWorshipPlaceById(params.id);
    res.json({ data: place });
  } catch (error) {
    next(error);
  }
}

export async function patchUpdateWorshipPlace(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof worshipPlaceIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof updateWorshipPlaceSchema>;
    const place = await service.updateWorshipPlace(params.id, body);
    res.json({ data: place });
  } catch (error) {
    next(error);
  }
}
