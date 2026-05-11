import { describe, expect, test } from "bun:test";
import { campaignDetailSchema, createCampaignSchema } from "../campaigns.schema.js";

describe("campaign schemas", () => {
  test("createCampaignSchema keeps new impact fields", () => {
    const result = createCampaignSchema.safeParse({
      title: "Campaign A",
      description: "Campaign description",
      targetIdr: 10000000,
      panelCapacityKwp: "5",
      estimatedKwhAnnual: "1200",
      estimatedIdrSavings: 3000000,
      deadline: "2026-12-31T23:59:59.000Z",
      worshipPlaceId: "123e4567-e89b-12d3-a456-426614174000",
      fundUsage: "Install panels",
      energyProducedKwhMonthly: "1200",
      beneficiaries: 250,
      carbonReductionKgMonthly: "150.5",
      electricitySavingsIdrMonthly: 5000000,
      impactDescription: "Impact description",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.impactDescription).toBe("Impact description");
      expect(result.data.beneficiaries).toBe(250);
    }
  });

  test("campaignDetailSchema includes impact object", () => {
    const result = campaignDetailSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      title: "Campaign A",
      description: "Campaign description",
      status: "AKTIF",
      targetIdr: 10000000,
      raisedIdr: 5000000,
      donorCount: 12,
      deadline: "2026-12-31T23:59:59.000Z",
      progressPercent: 50,
      worshipPlace: {
        name: "Masjid Al-Ikhlas",
        city: "Jakarta",
        religionType: "Masjid",
      },
      energyImpact: {
        panelCapacityKwp: "5",
        estimatedKwhAnnual: "1200",
        estimatedIdrSavings: 3000000,
      },
      impact: {
        fundUsage: "Install panels",
        energyProducedKwhMonthly: "1200",
        beneficiaries: 250,
        carbonReductionKgMonthly: "150.5",
        electricitySavingsIdrMonthly: 5000000,
        impactDescription: "Impact description",
      },
      images: {
        cover: null,
        gallery: [],
        transparency: [],
        installation: [],
      },
      published: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.impact.impactDescription).toBe("Impact description");
    }
  });
});
