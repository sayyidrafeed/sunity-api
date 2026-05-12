import { describe, expect, test } from "bun:test";
import { activityLogSchema, activityLogListResponseSchema } from "../activity-logs.schema.js";

describe("activity logs schema", () => {
  test("accepts activity log shape", () => {
    const result = activityLogSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      campaignId: "123e4567-e89b-12d3-a456-426614174000",
      actorId: "user-1",
      action: "STATUS_CHANGED",
      entityType: "campaign",
      entityId: "123e4567-e89b-12d3-a456-426614174000",
      metadata: { from: "DRAFT", to: "AKTIF" },
      createdAt: new Date(),
    });

    expect(result.success).toBe(true);
  });

  test("accepts list response shape", () => {
    const result = activityLogListResponseSchema.safeParse({
      data: [],
      pagination: { page: 1, limit: 12, total: 0 },
    });

    expect(result.success).toBe(true);
  });
});
