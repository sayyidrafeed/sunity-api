import { describe, expect, test } from "bun:test";
import { ExpenseCampaignMismatchError, ExpenseNotFoundError } from "../expenses.service.js";

describe("expenses.service", () => {
  test("not found error includes code", () => {
    const error = new ExpenseNotFoundError("missing-id");
    expect(error.errorCode).toBe("EXPENSE_NOT_FOUND");
  });

  test("campaign mismatch error has correct status code and message", () => {
    const error = new ExpenseCampaignMismatchError("exp-1", "camp-1");
    expect(error.statusCode).toBe(403);
    expect(error.message.includes("exp-1")).toBeTruthy();
    expect(error.message.includes("camp-1")).toBeTruthy();
  });
});
