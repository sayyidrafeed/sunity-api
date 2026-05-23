import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { campaigns, donations, energyData } from "../../db/schema/index.js";
import { NotFoundError } from "../../lib/errors.js";

export class CampaignNotFoundError extends NotFoundError {
  constructor(campaignId: string) {
    super("Campaign tidak ditemukan", "CAMPAIGN_NOT_FOUND", `campaignId=${campaignId}`);
  }
}

export async function getAdminDashboard(campaignId: string, drizzleDb = db) {
  // 1. Fetch campaign core data
  const [campaign] = await drizzleDb
    .select({
      id: campaigns.id,
      title: campaigns.title,
      status: campaigns.status,
      deadline: campaigns.deadline,
      donorCount: campaigns.donorCount,
      raisedIdr: campaigns.raisedIdr,
      targetIdr: campaigns.targetIdr,
    })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));

  if (!campaign) {
    throw new CampaignNotFoundError(campaignId);
  }

  const now = new Date();

  // 2. Fetch donorCountToday (UTC date comparison, status must be SUCCESS)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [todayDonorsResult] = await drizzleDb
    .select({ count: sql<number>`count(*)` })
    .from(donations)
    .where(
      and(
        eq(donations.campaignId, campaignId),
        eq(donations.status, "SUCCESS"),
        gte(donations.createdAt, todayStart),
      ),
    );
  const donorCountToday = Number(todayDonorsResult?.count ?? 0);

  // 3. Fetch 5 most recent successful donations
  const recentDonationRecords = await drizzleDb
    .select({
      id: donations.id,
      donorName: donations.donorName,
      amountIdr: donations.amountIdr,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "SUCCESS")))
    .orderBy(desc(donations.createdAt))
    .limit(5);

  const recentDonations = recentDonationRecords.map((d) => ({
    id: d.id,
    donorName: d.donorName,
    amount: d.amountIdr,
    date: d.createdAt.toISOString(),
    method: "Transfer Bank", // Fallback default method as DB does not store payment method
  }));

  // 4. Fetch energy impact data
  const energyRecords = await drizzleDb
    .select({
      kwhProduced: energyData.kwhProduced,
      idrSaved: energyData.idrSaved,
      kgCo2Reduced: energyData.kgCo2Reduced,
      month: energyData.month,
    })
    .from(energyData)
    .where(eq(energyData.campaignId, campaignId))
    .orderBy(desc(energyData.month));

  let energyImpact:
    | {
        totalEnergyKwh: string;
        averageEnergyPerDayKwh: string;
        carbonReductionTon: string;
        costSavingsIdrMonthly: string;
        carbonReductionMomPercent: number;
      }
    | undefined = undefined;

  if (energyRecords.length > 0) {
    const totalEnergy = energyRecords.reduce((acc, curr) => acc + curr.kwhProduced, 0);

    // Days in current calendar month (UTC)
    const year = now.getUTCFullYear();
    const monthIndex = now.getUTCMonth();
    const daysInCurrentMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    // Latest month details (first element since sorted month DESC)
    const latestRecord = energyRecords[0];
    const averageEnergyPerDayKwh = (latestRecord.kwhProduced / daysInCurrentMonth).toFixed(1);

    const totalCo2 = energyRecords.reduce((acc, curr) => acc + curr.kgCo2Reduced, 0);
    const carbonReductionTon = (totalCo2 / 1000).toFixed(1);

    const costSavingsIdrMonthly = latestRecord.idrSaved.toString();

    // Calculate Month-on-Month change
    let carbonReductionMomPercent = 0;
    if (energyRecords.length >= 2) {
      const latestMonthCo2 = latestRecord.kgCo2Reduced;
      const previousMonthCo2 = energyRecords[1].kgCo2Reduced;
      if (previousMonthCo2 > 0) {
        carbonReductionMomPercent = Math.round(
          ((latestMonthCo2 - previousMonthCo2) / previousMonthCo2) * 100,
        );
      }
    }

    energyImpact = {
      totalEnergyKwh: totalEnergy.toString(),
      averageEnergyPerDayKwh,
      carbonReductionTon,
      costSavingsIdrMonthly,
      carbonReductionMomPercent,
    };
  }

  // 5. Calculations for Stats & Donations
  const deadlineTime = campaign.deadline.getTime();
  const nowTime = now.getTime();
  const daysRemaining = Math.max(0, Math.floor((deadlineTime - nowTime) / (1000 * 60 * 60 * 24)));

  // Status mapping to Indonesian label
  const statusMap: Record<typeof campaign.status, string> = {
    DRAFT: "Konsep",
    AKTIF: "Sedang Berjalan",
    INSTALASI: "Sedang Instalasi",
    SELESAI: "Selesai",
    ARCHIVED: "Diarsipkan",
  };
  const campaignStatus = statusMap[campaign.status] || campaign.status;

  const progressPercent = Math.min(
    100,
    campaign.targetIdr > 0 ? Math.round((campaign.raisedIdr / campaign.targetIdr) * 100) : 0,
  );

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      status: campaign.status,
      deadline: campaign.deadline.toISOString(),
    },
    stats: {
      donorCount: campaign.donorCount,
      donorCountToday,
      daysRemaining,
      campaignStatus,
    },
    donation: {
      raisedIdr: campaign.raisedIdr,
      targetIdr: campaign.targetIdr,
      progressPercent,
    },
    energyImpact,
    recentDonations,
  };
}
