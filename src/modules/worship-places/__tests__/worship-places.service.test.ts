import { describe, expect, test } from "bun:test";
import { WorshipPlaceNotFoundError } from "../worship-places.service.js";

describe("worship-places.service", () => {
  test("not found error includes code", () => {
    const error = new WorshipPlaceNotFoundError("missing-id");
    expect(error.errorCode).toBe("WORSHIP_PLACE_NOT_FOUND");
  });
});
