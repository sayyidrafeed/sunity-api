import { Router } from "express";
import { z } from "zod";
import { requirePermission, requireSession } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../lib/validate.js";
import { registry } from "../../lib/openapi.js";
import { errorSchema } from "../../lib/schemas.js";
import {
  campaignIdParamSchema,
  createExpenseSchema,
  expenseIdParamSchema,
  expenseListResponseSchema,
  expenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "./expenses.schema.js";
import * as handlers from "./expenses.handlers.js";

const successResponseSchema = z.object({ success: z.literal(true) });

export const expensesRouter = Router();

registry.registerPath({
  method: "get",
  path: "/admin/campaigns/{id}/expenses",
  tags: ["Admin Expenses"],
  summary: "List campaign expenses",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    query: listExpensesQuerySchema,
  },
  responses: {
    200: {
      description: "List of expenses",
      content: { "application/json": { schema: expenseListResponseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

expensesRouter.get(
  "/campaigns/:id/expenses",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateQuery(listExpensesQuerySchema),
  handlers.getListExpenses,
);

registry.registerPath({
  method: "post",
  path: "/admin/campaigns/{id}/expenses",
  tags: ["Admin Expenses"],
  summary: "Create campaign expense",
  security: [{ bearerAuth: [] }],
  request: {
    params: campaignIdParamSchema,
    body: { content: { "application/json": { schema: createExpenseSchema } } },
  },
  responses: {
    201: {
      description: "Expense created",
      content: { "application/json": { schema: expenseSchema } },
    },
    404: {
      description: "Campaign not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

expensesRouter.post(
  "/campaigns/:id/expenses",
  requireSession,
  requirePermission(["admin"]),
  validateParams(campaignIdParamSchema),
  validateBody(createExpenseSchema),
  handlers.postCreateExpense,
);

registry.registerPath({
  method: "patch",
  path: "/admin/expenses/{expenseId}",
  tags: ["Admin Expenses"],
  summary: "Update expense",
  security: [{ bearerAuth: [] }],
  request: {
    params: expenseIdParamSchema,
    body: { content: { "application/json": { schema: updateExpenseSchema } } },
  },
  responses: {
    200: {
      description: "Expense updated",
      content: { "application/json": { schema: expenseSchema } },
    },
    404: {
      description: "Expense not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

expensesRouter.patch(
  "/expenses/:expenseId",
  requireSession,
  requirePermission(["admin"]),
  validateParams(expenseIdParamSchema),
  validateBody(updateExpenseSchema),
  handlers.patchUpdateExpense,
);

registry.registerPath({
  method: "delete",
  path: "/admin/expenses/{expenseId}",
  tags: ["Admin Expenses"],
  summary: "Delete expense",
  security: [{ bearerAuth: [] }],
  request: {
    params: expenseIdParamSchema,
  },
  responses: {
    200: {
      description: "Expense deleted",
      content: { "application/json": { schema: successResponseSchema } },
    },
    404: {
      description: "Expense not found",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

expensesRouter.delete(
  "/expenses/:expenseId",
  requireSession,
  requirePermission(["admin"]),
  validateParams(expenseIdParamSchema),
  handlers.deleteExpense,
);
