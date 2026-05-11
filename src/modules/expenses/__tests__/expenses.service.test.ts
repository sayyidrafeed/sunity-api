import { describe, expect, test } from "bun:test";
import { ExpenseNotFoundError } from "../expenses.service.js";

describe("expenses.service", () => {
  test("not found error includes code", () => {
    const error = new ExpenseNotFoundError("missing-id");
    expect(error.errorCode).toBe("EXPENSE_NOT_FOUND");
  });
});
