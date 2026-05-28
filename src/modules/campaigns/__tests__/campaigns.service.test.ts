import { describe, expect, test } from "bun:test";
import { CampaignNotFoundError, AssetNotFoundError } from "../campaigns.service.js";

describe("campaigns.service", () => {
  test("CampaignNotFoundError has correct error code and status", () => {
    const error = new CampaignNotFoundError("some-id");
    expect(error.errorCode).toBe("CAMPAIGN_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.message.includes("campaignId=some-id")).toBeTruthy();
  });

  test("CampaignNotFoundError works without id", () => {
    const error = new CampaignNotFoundError();
    expect(error.errorCode).toBe("CAMPAIGN_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });

  test("AssetNotFoundError has correct error code and status", () => {
    const error = new AssetNotFoundError("some-id");
    expect(error.errorCode).toBe("ASSET_NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.message.includes("assetId=some-id")).toBeTruthy();
  });

  test("AssetNotFoundError works without id", () => {
    const error = new AssetNotFoundError();
    expect(error.errorCode).toBe("ASSET_NOT_FOUND");
    expect(error.statusCode).toBe(404);
  });
});
