import { describe, expect, test } from "bun:test";
import { createWorshipPlaceSchema } from "../worship-places.schema.js";

describe("worship place validation", () => {
  test("validates contact phone format", () => {
    const valid = createWorshipPlaceSchema.safeParse({
      name: "Masjid Al-Ikhlas",
      religionType: "Masjid",
      address: "Jl. Merdeka 1",
      city: "Jakarta",
      contactPhone: "+628123456789",
    });

    const invalid = createWorshipPlaceSchema.safeParse({
      name: "Masjid Al-Ikhlas",
      religionType: "Masjid",
      address: "Jl. Merdeka 1",
      city: "Jakarta",
      contactPhone: "12345",
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
