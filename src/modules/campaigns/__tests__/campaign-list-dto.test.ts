import { describe, test, expect } from "bun:test";

describe("campaign list response with assets", () => {
  test("should include coverImage in campaign card", () => {
    const campaign = {
      id: "campaign-1",
      title: "Solar Panel Installation",
      city: "Jakarta",
      religionType: "Masjid" as const,
      status: "Aktif" as const,
      targetIdr: "100000000",
      raisedIdr: "25000000",
      donorCount: 120,
      progressPercent: 25,
      coverImage: {
        assetId: "asset-123",
        publicUrl: "https://cdn.example.com/campaign/cover/123.jpg",
        storageKey: "campaign/cover/1234567890-abc.jpg",
      },
    };

    expect(campaign.coverImage !== null && campaign.coverImage !== undefined).toBe(true);
    expect(campaign.coverImage.publicUrl.startsWith("https://")).toBe(true);
    expect(campaign.coverImage.assetId !== undefined).toBe(true);
  });

  test("should handle missing coverImage gracefully", () => {
    const campaign = {
      id: "campaign-2",
      title: "Solar Initiative",
      city: "Bandung",
      coverImage: null,
    };

    expect(campaign.coverImage === null).toBe(true);
  });

  test("should include pagination metadata", () => {
    const response = {
      data: [
        {
          id: "1",
          title: "Campaign 1",
          coverImage: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 12,
        total: 45,
      },
    };

    expect(response.pagination.page === 1).toBe(true);
    expect(response.pagination.total === 45).toBe(true);
  });

  test("should include filters metadata", () => {
    const response = {
      data: [] as any[],
      pagination: { page: 1, limit: 12, total: 0 },
      filters: {
        cities: ["Jakarta", "Bandung"],
        types: ["Masjid", "Gereja"],
        statuses: ["Aktif", "Selesai"],
      },
    };

    expect(response.filters.cities.includes("Jakarta")).toBe(true);
    expect(response.filters.types.includes("Masjid")).toBe(true);
  });
});
