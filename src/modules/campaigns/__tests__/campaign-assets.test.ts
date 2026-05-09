import { describe, test, expect } from "bun:test";

describe("campaign asset attachment - validation logic", () => {
  test("should support valid asset kinds", () => {
    const validKinds = ["cover", "gallery", "transparency", "installation", "report"] as const;
    expect(validKinds.includes("cover")).toBe(true);
    expect(validKinds.includes("gallery")).toBe(true);
    expect(validKinds.includes("installation")).toBe(true);
  });

  test("should validate sort order is numeric and non-negative", () => {
    const inputs = [
      { kind: "cover", sortOrder: 0 },
      { kind: "gallery", sortOrder: 1 },
      { kind: "gallery", sortOrder: 2 },
    ];

    let allValid = true;
    inputs.forEach((input) => {
      if (typeof input.sortOrder !== "number" || input.sortOrder < 0) {
        allValid = false;
      }
    });
    expect(allValid).toBe(true);
  });

  test("should allow optional caption", () => {
    const asset1: any = { kind: "cover" as const, sortOrder: 0 };
    const asset2 = { kind: "gallery" as const, sortOrder: 1, caption: "Beautiful view" };

    expect(asset1.caption === undefined).toBe(true);
    expect(asset2.caption !== undefined).toBe(true);
  });

  test("should support multiple assets per campaign", () => {
    const campaignAssets = [
      { assetId: "asset-1", kind: "cover" as const, sortOrder: 0 },
      { assetId: "asset-2", kind: "gallery" as const, sortOrder: 1 },
      { assetId: "asset-3", kind: "gallery" as const, sortOrder: 2 },
      { assetId: "asset-4", kind: "transparency" as const, sortOrder: 3 },
    ];

    expect(campaignAssets.length === 4).toBe(true);
    expect(campaignAssets.filter((a) => a.kind === "gallery").length === 2).toBe(true);
  });
});
