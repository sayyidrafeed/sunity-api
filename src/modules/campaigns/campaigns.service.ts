import { eq, ilike, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../db/client.js";
import { campaigns } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  publishSchema,
  listCampaignQuerySchema,
} from "./campaigns.schema.js";

export class CampaignNotFoundError extends Error {
  constructor(id: string) {
    super(`Campaign not found: ${id}`);
    this.name = "CampaignNotFoundError";
  }
}

export async function createCampaign(userId: string, data: z.infer<typeof createCampaignSchema>) {
  const id = nanoid();
  const { deadline, ...rest } = data;
  const [campaign] = await db
    .insert(campaigns)
    .values({
      id,
      userId,
      ...rest,
      deadline: new Date(deadline),
    })
    .returning();
  return campaign;
}

export async function listCampaigns(query: z.infer<typeof listCampaignQuerySchema>) {
  const { page, limit, search, city, type, status } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(ilike(campaigns.title, `%${search}%`));
  if (city) conditions.push(ilike(campaigns.city, `%${city}%`));
  if (type) conditions.push(eq(campaigns.religionType, type));
  if (status) conditions.push(eq(campaigns.status, status));
  conditions.push(eq(campaigns.isPublished, true));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(campaigns).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

export async function getCampaignById(id: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function updateCampaign(id: string, data: z.infer<typeof updateCampaignSchema>) {
  const { deadline, ...rest } = data;
  const updateData: Partial<typeof campaigns.$inferInsert> = {
    ...rest,
    updatedAt: new Date(),
  };
  if (deadline !== undefined) {
    updateData.deadline = new Date(deadline);
  }
  const [campaign] = await db
    .update(campaigns)
    .set(updateData)
    .where(eq(campaigns.id, id))
    .returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function updateCampaignStatus(id: string, data: z.infer<typeof updateStatusSchema>) {
  const [campaign] = await db
    .update(campaigns)
    .set({ status: data.status, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function publishCampaign(id: string, data: z.infer<typeof publishSchema>) {
  const [campaign] = await db
    .update(campaigns)
    .set({ isPublished: data.isPublished, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}

export async function deleteCampaign(id: string) {
  const [campaign] = await db.delete(campaigns).where(eq(campaigns.id, id)).returning();
  if (!campaign) throw new CampaignNotFoundError(id);
  return campaign;
}
