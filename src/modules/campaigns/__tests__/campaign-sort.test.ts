import { describe, expect, test } from "bun:test";
import { listCampaignQuerySchema } from "../campaigns.schema.js";

describe("campaign list sorting", () => {
  test("accepts sortBy and order", () => {
    const result = listCampaignQuerySchema.safeParse({
      page: 1,
      limit: 12,
      sortBy: "deadline",
      order: "asc",
    });

    expect(result.success).toBe(true);
  });
});
