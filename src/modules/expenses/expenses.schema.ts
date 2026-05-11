import { z } from "zod";
import { createSelectSchema } from "drizzle-zod";
import { expenses } from "../../db/schema/index.js";

const expenseSelectSchema = createSelectSchema(expenses);

export const expenseSchema = expenseSelectSchema
  .pick({
    id: true,
    campaignId: true,
    title: true,
    description: true,
    amountIdr: true,
    spentAt: true,
    receiptAssetId: true,
    category: true,
    createdAt: true,
    updatedAt: true,
  })
  .openapi("Expense");

export const createExpenseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amountIdr: z.number().int().positive(),
  spentAt: z.string().datetime(),
  receiptAssetId: z.string().uuid().optional(),
  category: z.enum(["EQUIPMENT", "INSTALLATION", "MATERIAL", "OPERATIONAL", "OTHER"]),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseIdParamSchema = z.object({
  expenseId: z.string().uuid(),
});

export const campaignIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(12),
});

export const expenseListResponseSchema = z.object({
  data: z.array(expenseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});
