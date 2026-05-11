import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaigns, expenses } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "./expenses.schema.js";
import { NotFoundError } from "../../lib/errors.js";

export class ExpenseNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Expense not found", "EXPENSE_NOT_FOUND", id ? `expenseId=${id}` : undefined);
  }
}

export class CampaignNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Campaign not found", "CAMPAIGN_NOT_FOUND", id ? `campaignId=${id}` : undefined);
  }
}

export async function listExpenses(
  campaignId: string,
  query: z.infer<typeof listExpensesQuerySchema>,
) {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) throw new CampaignNotFoundError(campaignId);

  const where = and(eq(expenses.campaignId, campaignId));

  const [data, countResult] = await Promise.all([
    db.select().from(expenses).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

export async function createExpense(campaignId: string, data: z.infer<typeof createExpenseSchema>) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) throw new CampaignNotFoundError(campaignId);

  const [expense] = await db
    .insert(expenses)
    .values({
      ...data,
      campaignId,
      spentAt: new Date(data.spentAt),
    })
    .returning();
  return expense;
}

export async function updateExpense(expenseId: string, data: z.infer<typeof updateExpenseSchema>) {
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.spentAt) {
    updateData.spentAt = new Date(data.spentAt);
  }
  const [expense] = await db
    .update(expenses)
    .set(updateData)
    .where(eq(expenses.id, expenseId))
    .returning();
  if (!expense) throw new ExpenseNotFoundError(expenseId);
  return expense;
}

export async function deleteExpense(expenseId: string) {
  const [expense] = await db.delete(expenses).where(eq(expenses.id, expenseId)).returning();
  if (!expense) throw new ExpenseNotFoundError(expenseId);
  return expense;
}
