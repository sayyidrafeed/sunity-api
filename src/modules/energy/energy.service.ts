import { eq, and, sql, asc, desc, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { energyData, campaigns } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createEnergySchema,
  updateEnergySchema,
  listEnergyQuerySchema,
} from "./energy.schema.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";

export class EnergyRecordNotFoundError extends NotFoundError {
  constructor(month?: string) {
    super(
      "Energy record not found",
      "ENERGY_RECORD_NOT_FOUND",
      month ? `month=${month}` : undefined,
    );
  }
}

export class EnergyRecordConflictError extends ConflictError {
  month: string;
  constructor(month: string) {
    super(
      "Energy record for this month already exists",
      "ENERGY_RECORD_CONFLICT",
      `month=${month}`,
    );
    this.month = month;
  }
}

async function verifyCampaignCompleted(campaignId: string, repository = db): Promise<boolean> {
  const [campaign] = await repository
    .select({ id: campaigns.id, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!campaign) {
    throw new NotFoundError("Campaign not found", "CAMPAIGN_NOT_FOUND", `campaignId=${campaignId}`);
  }
  return campaign.status === "SELESAI";
}

async function getEnergySummary(campaignId: string) {
  const [summary] = await db
    .select({
      totalKwhProduced: sql<number>`COALESCE(SUM(${energyData.kwhProduced}::numeric), 0)`,
      totalIdrSaved: sql<number>`COALESCE(SUM(${energyData.idrSaved}), 0)`,
      totalKgCo2Reduced: sql<number>`COALESCE(SUM(${energyData.kgCo2Reduced}::numeric), 0)`,
    })
    .from(energyData)
    .where(eq(energyData.campaignId, campaignId));
  return {
    totalKwhProduced: Number(summary.totalKwhProduced),
    totalIdrSaved: Number(summary.totalIdrSaved),
    totalKgCo2Reduced: Number(summary.totalKgCo2Reduced),
  };
}

export async function getEnergyData(
  campaignId: string,
  query: z.infer<typeof listEnergyQuerySchema>,
) {
  const isCompleted = await verifyCampaignCompleted(campaignId);
  if (!isCompleted) {
    return {
      available: false,
      message: "Energy dashboard tersedia setelah kampanye selesai dan instalasi terkonfirmasi.",
    };
  }

  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const [summary, chartData, tableResult, countResult] = await Promise.all([
    getEnergySummary(campaignId),
    db
      .select()
      .from(energyData)
      .where(eq(energyData.campaignId, campaignId))
      .orderBy(asc(energyData.month)),
    db
      .select()
      .from(energyData)
      .where(eq(energyData.campaignId, campaignId))
      .orderBy(desc(energyData.month))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(energyData)
      .where(eq(energyData.campaignId, campaignId)),
  ]);
  return {
    available: true,
    summary,
    chartData,
    tableData: { data: tableResult, total: Number(countResult[0].count), page, limit },
  };
}

export async function createEnergyRecord(
  campaignId: string,
  data: z.infer<typeof createEnergySchema>,
) {
  const isCompleted = await verifyCampaignCompleted(campaignId);
  if (!isCompleted) {
    throw new ConflictError(
      "Campaign must be completed to add energy records",
      "CAMPAIGN_NOT_COMPLETED",
    );
  }
  const [existing] = await db
    .select({ id: energyData.id })
    .from(energyData)
    .where(and(eq(energyData.campaignId, campaignId), eq(energyData.month, data.month)));
  if (existing) {
    throw new EnergyRecordConflictError(data.month);
  }
  const [record] = await db
    .insert(energyData)
    .values({
      campaignId,
      month: data.month,
      kwhProduced: data.kwhProduced,
      idrSaved: data.idrSaved,
      kgCo2Reduced: data.kgCo2Reduced,
    })
    .returning();
  return record;
}

export async function overwriteEnergyRecord(
  campaignId: string,
  data: z.infer<typeof createEnergySchema>,
) {
  const isCompleted = await verifyCampaignCompleted(campaignId);
  if (!isCompleted) {
    throw new ConflictError(
      "Campaign must be completed to add energy records",
      "CAMPAIGN_NOT_COMPLETED",
    );
  }
  const [record] = await db
    .insert(energyData)
    .values({
      campaignId,
      month: data.month,
      kwhProduced: data.kwhProduced,
      idrSaved: data.idrSaved,
      kgCo2Reduced: data.kgCo2Reduced,
    })
    .onConflictDoUpdate({
      target: [energyData.campaignId, energyData.month],
      set: {
        kwhProduced: data.kwhProduced,
        idrSaved: data.idrSaved,
        kgCo2Reduced: data.kgCo2Reduced,
        updatedAt: new Date(),
      },
    })
    .returning();
  return record;
}

export async function updateEnergyRecord(
  campaignId: string,
  month: string,
  data: z.infer<typeof updateEnergySchema>,
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.kwhProduced !== undefined) updateData.kwhProduced = data.kwhProduced;
  if (data.idrSaved !== undefined) updateData.idrSaved = data.idrSaved;
  if (data.kgCo2Reduced !== undefined) updateData.kgCo2Reduced = data.kgCo2Reduced;

  const [record] = await db
    .update(energyData)
    .set(updateData)
    .where(and(eq(energyData.campaignId, campaignId), eq(energyData.month, month)))
    .returning();
  if (!record) throw new EnergyRecordNotFoundError(month);
  return record;
}

export async function deleteEnergyRecord(campaignId: string, month: string) {
  const [record] = await db
    .delete(energyData)
    .where(and(eq(energyData.campaignId, campaignId), eq(energyData.month, month)))
    .returning();
  if (!record) throw new EnergyRecordNotFoundError(month);
  return record;
}

export async function bulkUploadEnergyRecords(
  campaignId: string,
  records: z.infer<typeof createEnergySchema>[],
  repository = db,
) {
  const isCompleted = await verifyCampaignCompleted(campaignId, repository);
  if (!isCompleted) {
    throw new ConflictError(
      "Campaign must be completed to add energy records",
      "CAMPAIGN_NOT_COMPLETED",
    );
  }

  const months = records.map((r) => r.month);

  const existingRecords = await repository
    .select({ month: energyData.month })
    .from(energyData)
    .where(and(eq(energyData.campaignId, campaignId), inArray(energyData.month, months)));

  const existingMonths = new Set(existingRecords.map((r) => r.month));
  const updatedCount = existingMonths.size;
  const createdCount = records.length - updatedCount;

  const values = records.map((data) => ({
    campaignId,
    month: data.month,
    kwhProduced: data.kwhProduced,
    idrSaved: data.idrSaved,
    kgCo2Reduced: data.kgCo2Reduced,
  }));

  const upserted = await repository
    .insert(energyData)
    .values(values)
    .onConflictDoUpdate({
      target: [energyData.campaignId, energyData.month],
      set: {
        kwhProduced: sql`EXCLUDED.kwh_produced`,
        idrSaved: sql`EXCLUDED.idr_saved`,
        kgCo2Reduced: sql`EXCLUDED.kg_co2_reduced`,
        updatedAt: new Date(),
      },
    })
    .returning();

  upserted.sort((a, b) => a.month.localeCompare(b.month));

  return {
    data: upserted,
    created: createdCount,
    updated: updatedCount,
  };
}
