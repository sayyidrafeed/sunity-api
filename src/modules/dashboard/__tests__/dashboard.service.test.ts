import { describe, expect, test } from "bun:test";
import { getAdminDashboard, CampaignNotFoundError } from "../dashboard.service.js";
import { campaigns, donations, energyData } from "../../../db/schema/index.js";

function createMockDb(fixtures: {
  campaign: any;
  todayDonationsCount: number;
  recentDonations: any[];
  energyRecords: any[];
}) {
  return {
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          return {
            where: () => {
              if (table === campaigns) {
                return Promise.resolve(fixtures.campaign ? [fixtures.campaign] : []);
              }
              if (table === donations) {
                if (fields && fields.count) {
                  return Promise.resolve([{ count: fixtures.todayDonationsCount }]);
                }
                return {
                  orderBy: () => {
                    return {
                      limit: () => Promise.resolve(fixtures.recentDonations),
                    };
                  },
                };
              }
              if (table === energyData) {
                return {
                  orderBy: () => Promise.resolve(fixtures.energyRecords),
                };
              }
              return Promise.resolve([]);
            },
          };
        },
      };
    },
  } as any;
}

describe("dashboard.service", () => {
  const campaignId = "6a2f3b4c-9f8e-4d7a-ba92-938f38c82301";

  test("throws CampaignNotFoundError when campaign does not exist", async () => {
    const mockDb = createMockDb({
      campaign: null,
      todayDonationsCount: 0,
      recentDonations: [],
      energyRecords: [],
    });

    let threw = false;
    try {
      await getAdminDashboard(campaignId, mockDb);
    } catch (e) {
      if (e instanceof CampaignNotFoundError) {
        threw = true;
      }
    }
    expect(threw).toBe(true);
  });

  test("calculates statistics and returns data correctly with energy data", async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10); // 10 days remaining

    const mockCampaign = {
      id: campaignId,
      title: "Test Campaign",
      status: "AKTIF" as const,
      deadline,
      donorCount: 120,
      raisedIdr: 45000000,
      targetIdr: 50000000,
    };

    const mockRecentDonations = [
      {
        id: "d1-uuid",
        donorName: "Budi",
        amountIdr: 500000,
        createdAt: new Date(),
      },
    ];

    const mockEnergyRecords = [
      {
        kwhProduced: 1200,
        idrSaved: 150000,
        kgCo2Reduced: 100,
        month: "2026-05",
      },
      {
        kwhProduced: 1000,
        idrSaved: 120000,
        kgCo2Reduced: 80,
        month: "2026-04",
      },
    ];

    const mockDb = createMockDb({
      campaign: mockCampaign,
      todayDonationsCount: 3,
      recentDonations: mockRecentDonations,
      energyRecords: mockEnergyRecords,
    });

    const result = await getAdminDashboard(campaignId, mockDb);

    // Verify Campaign Details
    expect(result.campaign.id).toBe(campaignId);
    expect(result.campaign.title).toBe("Test Campaign");
    expect(result.campaign.status).toBe("AKTIF");
    expect(result.campaign.deadline).toBe(deadline.toISOString());

    // Verify Stats Calculations
    expect(result.stats.donorCount).toBe(120);
    expect(result.stats.donorCountToday).toBe(3);
    expect(result.stats.daysRemaining >= 9 && result.stats.daysRemaining <= 10).toBe(true);
    expect(result.stats.campaignStatus).toBe("Sedang Berjalan");

    // Verify Donation Details
    expect(result.donation.raisedIdr).toBe(45000000);
    expect(result.donation.targetIdr).toBe(50000000);
    expect(result.donation.progressPercent).toBe(90);

    // Verify Recent Donations mapping
    expect(result.recentDonations.length).toBe(1);
    expect(result.recentDonations[0].donorName).toBe("Budi");
    expect(result.recentDonations[0].amount).toBe(500000);
    expect(result.recentDonations[0].method).toBe("Transfer Bank");

    // Verify Energy Impact Calculations
    expect(result.energyImpact !== undefined && result.energyImpact !== null).toBe(true);
    expect(result.energyImpact?.totalEnergyKwh).toBe("2200"); // 1200 + 1000
    expect(result.energyImpact?.carbonReductionTon).toBe("0.2"); // (100 + 80) / 1000
    expect(result.energyImpact?.costSavingsIdrMonthly).toBe("150000"); // latest saved IDR
    expect(result.energyImpact?.carbonReductionMomPercent).toBe(25); // ((100 - 80) / 80) * 100
  });

  test("handles missing energy data and clamp progressPercent correctly", async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() - 2); // 2 days in the past (daysRemaining = 0)

    const mockCampaign = {
      id: campaignId,
      title: "Expired Campaign",
      status: "SELESAI" as const,
      deadline,
      donorCount: 15,
      raisedIdr: 60000000,
      targetIdr: 50000000, // overraised (progressPercent should clamp to 100)
    };

    const mockDb = createMockDb({
      campaign: mockCampaign,
      todayDonationsCount: 0,
      recentDonations: [],
      energyRecords: [],
    });

    const result = await getAdminDashboard(campaignId, mockDb);

    expect(result.stats.daysRemaining).toBe(0);
    expect(result.stats.campaignStatus).toBe("Selesai");
    expect(result.donation.progressPercent).toBe(100);
    expect(result.energyImpact === undefined).toBe(true);
    expect(result.recentDonations.length).toBe(0);
  });

  test("calculates averageEnergyPerDayKwh using only latest month's energy", async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);

    const mockCampaign = {
      id: campaignId,
      title: "Test Campaign",
      status: "AKTIF" as const,
      deadline,
      donorCount: 50,
      raisedIdr: 25000000,
      targetIdr: 50000000,
    };

    // Multiple months of historical data
    const mockEnergyRecords = [
      {
        kwhProduced: 1000, // Latest month: May
        idrSaved: 150000,
        kgCo2Reduced: 100,
        month: "2026-05",
      },
      {
        kwhProduced: 800, // Previous month: April
        idrSaved: 120000,
        kgCo2Reduced: 80,
        month: "2026-04",
      },
      {
        kwhProduced: 600, // Previous month: March
        idrSaved: 90000,
        kgCo2Reduced: 60,
        month: "2026-03",
      },
    ];

    const mockDb = createMockDb({
      campaign: mockCampaign,
      todayDonationsCount: 0,
      recentDonations: [],
      energyRecords: mockEnergyRecords,
    });

    const result = await getAdminDashboard(campaignId, mockDb);

    // Total energy should still include all months
    expect(result.energyImpact?.totalEnergyKwh).toBe("2400"); // 1000 + 800 + 600

    // But averageEnergyPerDayKwh should use only the latest month (1000 kWh)
    // May has 31 days, so: 1000 / 31 = 32.25806... ≈ 32.3
    const now = new Date();
    const year = now.getUTCFullYear();
    const monthIndex = now.getUTCMonth();
    const daysInCurrentMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const expectedAverage = (1000 / daysInCurrentMonth).toFixed(1);

    expect(result.energyImpact?.averageEnergyPerDayKwh).toBe(expectedAverage);
  });
});
