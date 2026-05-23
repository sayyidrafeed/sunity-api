import { describe, expect, test } from "bun:test";
import { createEnergySchema, energyCsvRowSchema } from "../energy.schema.js";

describe("energy schema validation", () => {
  test("validates createEnergySchema formatting and positive values", () => {
    const valid = createEnergySchema.safeParse({
      month: "2024-05",
      kwhProduced: 150.5,
      idrSaved: 250000,
      kgCo2Reduced: 75.2,
    });

    const invalidMonth = createEnergySchema.safeParse({
      month: "24-05",
      kwhProduced: 150.5,
      idrSaved: 250000,
      kgCo2Reduced: 75.2,
    });

    const invalidNegativeValues = createEnergySchema.safeParse({
      month: "2024-05",
      kwhProduced: -10,
      idrSaved: -50000,
      kgCo2Reduced: -5,
    });
    expect(valid.success).toBe(true);
    expect(invalidMonth.success).toBe(false);
    expect(invalidNegativeValues.success).toBe(false);
  });

  test("validates energyCsvRowSchema coercion from string to number", () => {
    const validCoercion = energyCsvRowSchema.safeParse({
      month: "2024-05",
      kwh_produced: "150.5",
      idr_saved: "250000",
      kg_co2_reduced: "75.2",
    });
    expect(validCoercion.success).toBe(true);

    if (validCoercion.success) {
      expect(validCoercion.data.kwh_produced).toBe(150.5);
      expect(validCoercion.data.idr_saved).toBe(250000);
      expect(validCoercion.data.kg_co2_reduced).toBe(75.2);
    }
  });

  describe("bulkUploadEnergyBodySchema", () => {
    const { bulkUploadEnergyBodySchema } = require("../energy.schema.js");

    test("validates valid bulk payload", () => {
      const valid = bulkUploadEnergyBodySchema.safeParse({
        records: [
          { month: "2026-05", kwhProduced: 120, idrSaved: 200000, kgCo2Reduced: 80 },
          { month: "2026-06", kwhProduced: 150, idrSaved: 250000, kgCo2Reduced: 100 },
        ],
      });
      expect(valid.success).toBe(true);
    });

    test("rejects empty records array", () => {
      const invalid = bulkUploadEnergyBodySchema.safeParse({
        records: [],
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("At least one record is required");
      }
    });

    test("rejects duplicate months in the same request", () => {
      const invalid = bulkUploadEnergyBodySchema.safeParse({
        records: [
          { month: "2026-05", kwhProduced: 120, idrSaved: 200000, kgCo2Reduced: 80 },
          { month: "2026-05", kwhProduced: 150, idrSaved: 250000, kgCo2Reduced: 100 },
        ],
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe(
          "Duplicate months are not allowed in the same request",
        );
      }
    });

    test("rejects payloads exceeding 100 records", () => {
      const records = Array.from({ length: 101 }, (_, i) => {
        const year = 2026 + Math.floor(i / 12);
        const monthNum = (i % 12) + 1;
        const month = `${year}-${monthNum.toString().padStart(2, "0")}`;
        return { month, kwhProduced: 10, idrSaved: 1000, kgCo2Reduced: 5 };
      });
      const invalid = bulkUploadEnergyBodySchema.safeParse({ records });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].message).toBe("Maximum 100 records per request");
      }
    });
  });
});
