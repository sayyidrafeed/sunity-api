import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import * as service from "./expenses.service.js";
import { logActivity } from "../activity-logs/activity-logs.service.js";
import type {
  campaignIdParamSchema,
  campaignIdWithExpenseIdSchema,
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "./expenses.schema.js";

export async function getListExpenses(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const query = req.validatedQuery as z.infer<typeof listExpensesQuerySchema>;
    const result = await service.listExpenses(params.id, query);
    res.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    });
  } catch (error) {
    if (error instanceof service.ExpenseCampaignMismatchError) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function postCreateExpense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdParamSchema>;
    const body = req.validatedBody as z.infer<typeof createExpenseSchema>;
    const expense = await service.createExpense(params.id, body);
    if (req.session?.user?.id) {
      await logActivity({
        campaignId: expense.campaignId,
        actorId: req.session.user.id,
        action: "EXPENSE_CREATED",
        entityType: "expense",
        entityId: expense.id,
        metadata: { amountIdr: expense.amountIdr, category: expense.category },
      });
    }
    res.status(201).json({ data: expense });
  } catch (error) {
    if (error instanceof service.ExpenseCampaignMismatchError) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function patchUpdateExpense(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdWithExpenseIdSchema>;
    const body = req.validatedBody as z.infer<typeof updateExpenseSchema>;
    const expense = await service.updateExpense(params.id, params.expenseId, body);
    if (req.session?.user?.id) {
      await logActivity({
        campaignId: expense.campaignId,
        actorId: req.session.user.id,
        action: "EXPENSE_UPDATED",
        entityType: "expense",
        entityId: expense.id,
      });
    }
    res.json({ data: expense });
  } catch (error) {
    if (error instanceof service.ExpenseCampaignMismatchError) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
}

export async function deleteExpenseHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = req.validatedParams as z.infer<typeof campaignIdWithExpenseIdSchema>;
    const expense = await service.deleteExpense(params.id, params.expenseId);
    if (req.session?.user?.id) {
      await logActivity({
        campaignId: expense.campaignId,
        actorId: req.session.user.id,
        action: "EXPENSE_DELETED",
        entityType: "expense",
        entityId: expense.id,
      });
    }
    res.json({ success: true });
  } catch (error) {
    if (error instanceof service.ExpenseCampaignMismatchError) {
      res.status(403).json({ error: error.message });
      return;
    }
    next(error);
  }
}
