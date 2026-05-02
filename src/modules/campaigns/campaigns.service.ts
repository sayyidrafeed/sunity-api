import { eq, ilike, and, sql, or } from "drizzle-orm";
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
  constructor() {
    super(`Campaign not found`);
    this.name = "CampaignNotFoundError";
  }
}

export async function createCampaign(userId: string, data: z.infer<typeof createCampaignSchema>) {
  const { deadline, ...rest } = data;
  const [campaign] = await db
    .insert(campaigns)
    .values({
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
  if (search) {
    conditions.push(
      or(ilike(campaigns.title, `%${search}%`), ilike(campaigns.city, `%${search}%`)),
    );
  }
  if (city) conditions.push(ilike(campaigns.city, `%${city}%`));
  if (type) conditions.push(eq(campaigns.religionType, type));
  if (status) conditions.push(eq(campaigns.status, status));
  conditions.push(eq(campaigns.isPublished, true));
  const where = conditions.length ? and(...conditions) : undefined;
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

export async function getCampaignByFilters(query: { title: string; city: string }) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.title, query.title), eq(campaigns.city, query.city)));
  if (!campaign) throw new CampaignNotFoundError();
  return campaign;
}

export async function updateCampaign(
  query: { title: string; city: string },
  data: z.infer<typeof updateCampaignSchema>,
) {
  const { deadline, ...rest } = data;
  const updateData: any = {
    ...rest,
    updatedAt: new Date(),
  };
  if (deadline) {
    updateData.deadline = new Date(deadline);
  }
  const [campaign] = await db
    .update(campaigns)
    .set(updateData)
    .where(and(eq(campaigns.title, query.title), eq(campaigns.city, query.city)))
    .returning();
  if (!campaign) throw new CampaignNotFoundError();
  return campaign;
}

export async function updateCampaignStatus(
  query: { title: string; city: string },
  data: z.infer<typeof updateStatusSchema>,
) {
  const [campaign] = await db
    .update(campaigns)
    .set({
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.title, query.title), eq(campaigns.city, query.city)))
    .returning();
  if (!campaign) throw new CampaignNotFoundError();
  return campaign;
}

export async function publishCampaign(
  query: { title: string; city: string },
  data: z.infer<typeof publishSchema>,
) {
  const [campaign] = await db
    .update(campaigns)
    .set({
      isPublished: data.isPublished,
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.title, query.title), eq(campaigns.city, query.city)))
    .returning();

  if (!campaign) throw new CampaignNotFoundError();
  return campaign;
}

export async function deleteCampaign(query: { title: string; city: string }) {
  const [campaign] = await db
    .delete(campaigns)
    .where(and(eq(campaigns.title, query.title), eq(campaigns.city, query.city)))
    .returning();
  if (!campaign) throw new CampaignNotFoundError();
  return campaign;
}
