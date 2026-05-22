import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { activityLogs, campaigns } from "../../db/schema/index.js";
import type { z } from "zod";
import type { listActivityLogsQuerySchema, logActivitySchema } from "./activity-logs.schema.js";
import { NotFoundError } from "../../lib/errors.js";

export class CampaignNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Campaign not found", "CAMPAIGN_NOT_FOUND", id ? `campaignId=${id}` : undefined);
  }
}

export async function logActivity(input: z.infer<typeof logActivitySchema>) {
  const [log] = await db.insert(activityLogs).values(input).returning();
  return log;
}

export async function listActivityLogs(
  campaignId: string,
  query: z.infer<typeof listActivityLogsQuerySchema>,
) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) throw new CampaignNotFoundError(campaignId);

  const where = and(eq(activityLogs.campaignId, campaignId));

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(activityLogs)
      .where(where)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}
