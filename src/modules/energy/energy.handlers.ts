import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import * as service from "./energy.service.js";
import { logActivity } from "../activity-logs/activity-logs.service.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import type {
  campaignIdParamSchema,
  energyMonthParamSchema,
  createEnergySchema,
  listEnergyQuerySchema,
  updateEnergySchema,
  bulkUploadEnergyBodySchema,
} from "./energy.schema.js";

async function logEnergyActivity(
  campaignId: string,
  action: string,
  entityId: string,
  userId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (userId) {
    await logActivity({
      campaignId,
      actorId: userId,
      action,
      entityType: "energy",
      entityId,
      metadata,
    });
  }
}

export async function getEnergyData(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const query = req.validatedQuery as z.infer<typeof listEnergyQuerySchema>;
    const result = await service.getEnergyData(params.id, query);
    if (!result.available || !result.tableData) {
      res
        .status(403)
        .json({ error: { code: "ENERGY_DASHBOARD_NOT_AVAILABLE", message: result.message } });
      return;
    }
    res.json({
      summary: result.summary,
      data: result.tableData.data,
      pagination: {
        page: result.tableData.page,
        limit: result.tableData.limit,
        total: result.tableData.total,
      },
    });
  } catch (error) {
    if (error instanceof service.EnergyRecordNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function postCreateEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof createEnergySchema>;
    const record = await service.createEnergyRecord(params.id, body);
    await logEnergyActivity(params.id, "ENERGY_RECORD_CREATED", record.id, req.session?.user?.id, {
      month: record.month,
      kwhProduced: record.kwhProduced,
    });
    res.status(201).json({ data: record });
  } catch (error) {
    if (error instanceof service.EnergyRecordConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function putOverwriteEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof createEnergySchema>;
    const record = await service.overwriteEnergyRecord(params.id, body);
    await logEnergyActivity(
      params.id,
      "ENERGY_RECORD_OVERWRITTEN",
      record.id,
      req.session?.user?.id,
      {
        month: record.month,
        kwhProduced: record.kwhProduced,
      },
    );
    res.json({ data: record });
  } catch (error) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function patchUpdateEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof energyMonthParamSchema>;
    const body = req.validatedBody as z.infer<typeof updateEnergySchema>;
    const record = await service.updateEnergyRecord(params.id, params.month, body);
    await logEnergyActivity(params.id, "ENERGY_RECORD_UPDATED", record.id, req.session?.user?.id, {
      month: record.month,
    });
    res.json({ data: record });
  } catch (error) {
    if (error instanceof service.EnergyRecordNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteEnergyHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof energyMonthParamSchema>;
    const record = await service.deleteEnergyRecord(params.id, params.month);
    await logEnergyActivity(params.id, "ENERGY_RECORD_DELETED", record.id, req.session?.user?.id, {
      month: record.month,
    });
    res.json({ success: true });
  } catch (error) {
    if (error instanceof service.EnergyRecordNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function postBulkUploadEnergy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof bulkUploadEnergyBodySchema>;
    const result = await service.bulkUploadEnergyRecords(params.id, body.records);
    await logEnergyActivity(
      params.id,
      "ENERGY_RECORD_BULK_UPLOADED",
      params.id,
      req.session?.user?.id,
      {
        count: result.data.length,
        created: result.created,
        updated: result.updated,
      },
    );
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
}
