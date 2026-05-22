import { describe, expect, test } from "bun:test";
import { updateStatusSchema } from "../campaigns.schema.js";

describe("campaign status validation", () => {
  test("accepts new statuses", () => {
    const validStatuses = ["DRAFT", "ARCHIVED", "AKTIF", "INSTALASI", "SELESAI"];
    for (const status of validStatuses) {
      const result = updateStatusSchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });
});
