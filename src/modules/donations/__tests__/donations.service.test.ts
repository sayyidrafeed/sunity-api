import { describe, expect, test } from "bun:test";
import {
  DonationNotFoundError,
  InvalidSignatureError,
  DonationCampaignNotFoundError,
} from "../donations.service.js";

describe("donations.service", () => {
  test("DonationNotFoundError has correct error code and status code", () => {
    const error = new DonationNotFoundError("order-123");
    expect(error.errorCode).toBe("DONATION_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });

  test("InvalidSignatureError has correct error code and status code", () => {
    const error = new InvalidSignatureError();
    expect(error.errorCode).toBe("INVALID_SIGNATURE");
    expect(error.statusCode).toBe(403);
  });

  test("DonationCampaignNotFoundError has correct error code and status code", () => {
    const error = new DonationCampaignNotFoundError("campaign-123");
    expect(error.errorCode).toBe("DONATION_CAMPAIGN_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});
