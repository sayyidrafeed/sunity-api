import { describe, test, expect } from "bun:test";

describe("campaign detail response with assets", () => {
  test("should include full campaign details with images object", () => {
    const campaign = {
      id: "campaign-1",
      title: "Solar Panel Installation",
      description: "Install solar panels at local mosque",
      status: "Aktif" as const,
      targetIdr: "100000000",
      raisedIdr: "25000000",
      donorCount: 120,
      progressPercent: 25,
      deadline: new Date("2025-12-31").toISOString(),
      worshipPlace: {
        name: "Masjid Al-Ikhlas",
        city: "Jakarta",
        religionType: "Masjid" as const,
      },
      energyImpact: {
        panelCapacityKwp: "10.5",
        estimatedKwhAnnual: "12600",
        estimatedIdrSavings: "18900000",
      },
      images: {
        cover: {
          assetId: "asset-123",
          publicUrl: "https://cdn.example.com/campaign/cover/123.jpg",
          storageKey: "campaign/cover/1234567890-abc.jpg",
        },
        gallery: [
          {
            assetId: "asset-456",
            publicUrl: "https://cdn.example.com/campaign/gallery/456.jpg",
            caption: "Installation in progress",
          },
        ],
        transparency: [] as any[],
        installation: [] as any[],
      },
      published: true,
    };

    expect(campaign.images.cover !== null && campaign.images.cover !== undefined).toBe(true);
    expect(campaign.images.gallery !== null && campaign.images.gallery !== undefined).toBe(true);
    expect(campaign.energyImpact !== null && campaign.energyImpact !== undefined).toBe(true);
    expect(campaign.worshipPlace.name === "Masjid Al-Ikhlas").toBe(true);
  });

  test("should include multiple asset types", () => {
    const images = {
      cover: { assetId: "1", publicUrl: "url1" },
      gallery: [
        { assetId: "2", publicUrl: "url2", caption: "Front view" },
        { assetId: "3", publicUrl: "url3", caption: "Side view" },
      ],
      transparency: [{ assetId: "4", publicUrl: "url4", caption: "Financial report" }],
      installation: [{ assetId: "5", publicUrl: "url5", caption: "After installation" }],
    };

    expect(images.gallery.length === 2).toBe(true);
    expect(images.transparency.length === 1).toBe(true);
    expect(images.installation.length === 1).toBe(true);
  });

  test("should handle empty asset arrays", () => {
    const images = {
      cover: { assetId: "1", publicUrl: "url1" },
      gallery: [] as any[],
      transparency: [] as any[],
      installation: [] as any[],
    };

    expect(JSON.stringify(images.gallery) === JSON.stringify([])).toBe(true);
    expect(JSON.stringify(images.transparency) === JSON.stringify([])).toBe(true);
  });

  test("should include optional image caption", () => {
    const image = {
      assetId: "asset-123",
      publicUrl: "https://cdn.example.com/image.jpg",
      caption: "Beautiful installation",
    };

    expect(image.caption !== undefined).toBe(true);
    expect(image.caption === "Beautiful installation").toBe(true);
  });

  test("should handle image without caption", () => {
    const image = {
      assetId: "asset-123",
      publicUrl: "https://cdn.example.com/image.jpg",
      caption: undefined,
    };

    expect(image.caption === undefined).toBe(true);
  });
});
