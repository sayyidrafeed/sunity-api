import { describe, expect, test } from "bun:test";
import { errorSchema } from "../schemas.js";

describe("errorSchema", () => {
  test("accepts structured error shape", () => {
    const result = errorSchema.safeParse({
      error: { code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" },
    });

    expect(result.success).toBe(true);
  });
});
