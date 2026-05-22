import { describe, expect, test } from "bun:test";
import { EnergyRecordConflictError, EnergyRecordNotFoundError } from "../energy.service.js";

describe("energy.service", () => {
  test("not found error includes code", () => {
    const error = new EnergyRecordNotFoundError("2024-05");
    expect(error.errorCode).toBe("ENERGY_RECORD_NOT_FOUND");
  });

  test("conflict error has correct code, message, and stores month", () => {
    const error = new EnergyRecordConflictError("2024-05");
    expect(error.errorCode).toBe("ENERGY_RECORD_CONFLICT");
    expect(error.month).toBe("2024-05");
    expect(error.message.includes("already exists")).toBeTruthy();
  });
});
