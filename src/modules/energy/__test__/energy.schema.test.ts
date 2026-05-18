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
});
