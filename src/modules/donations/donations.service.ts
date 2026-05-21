import { eq, and, desc, sql } from "drizzle-orm";
import midtransClient from "midtrans-client";
import { db } from "../../db/client.js";
import { donations, campaigns } from "../../db/schema/index.js";
import type { z } from "zod";
import type { createDonationSchema, listDonationsQuerySchema } from "./donations.schema.js";
import { NotFoundError } from "../../lib/errors.js";
import { env } from "../../env.js";

export class DonationNotFoundError extends NotFoundError {
  constructor(orderId?: string) {
    super(
      "Donation record not found",
      "DONATION_NOT_FOUND",
      orderId ? `midtransOrderId=${orderId}` : undefined,
    );
  }
}

export class DonationCampaignNotFoundError extends NotFoundError {
  constructor(campaignId: string) {
    super(
      "Campaign for donation not found",
      "DONATION_CAMPAIGN_NOT_FOUND",
      `campaignId=${campaignId}`,
    );
  }
}

// Perbaikan konfigurasi object key agar sesuai dengan midtrans-client SDK
const snap = new midtransClient.Snap({
  isProduction: env.nodeEnv === "production",
  serverKey: env.midtransServerKey,
  clientKey: env.midtransClientKey,
});

async function verifyCampaignExists(campaignId: string): Promise<void> {
  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId));
  if (!campaign) {
    throw new DonationCampaignNotFoundError(campaignId);
  }
}

export async function initiateDonationRecord(
  campaignId: string,
  data: z.infer<typeof createDonationSchema>,
) {
  await verifyCampaignExists(campaignId);

  const midtransOrderId = `SUNITY-DON-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Pastikan nominal bertipe number murni sebelum dikirim ke Midtrans
  const amount = Number(data.nominal);

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: data.hideName ? "Anonim" : data.name || "Anonim",
      email: data.email,
    },
    usage_limit: 1,
  } as any);

  const [record] = await db
    .insert(donations)
    .values({
      campaignId,
      donorName: data.name || "Anonim",
      donorEmail: data.email,
      amountIdr: amount,
      isAnonymous: data.hideName,
      midtransOrderId,
      status: "PENDING",
    })
    .returning();

  if (!record) {
    throw new Error("Failed to store donation record");
  }

  // Lakukan penegasan tipe (type assertion) pada kembalian transaksi Midtrans
  return {
    ...record,
    snapToken: transaction.token as string,
    redirectUrl: transaction.redirect_url as string,
  };
}

export async function getCampaignDonations(
  campaignId: string,
  query: z.infer<typeof listDonationsQuerySchema>,
) {
  await verifyCampaignExists(campaignId);

  const { page, limit } = query;
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: donations.id,
        donorName: donations.donorName,
        amountIdr: donations.amountIdr,
        isAnonymous: donations.isAnonymous,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "SUCCESS")))
      .orderBy(desc(donations.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(donations)
      .where(and(eq(donations.campaignId, campaignId), eq(donations.status, "SUCCESS"))),
  ]);

  return {
    data,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  };
}

export async function processMidtransWebhook(midtransOrderId: string, transactionStatus: string) {
  const [donation] = await db
    .select()
    .from(donations)
    .where(eq(donations.midtransOrderId, midtransOrderId));

  if (!donation) {
    throw new DonationNotFoundError(midtransOrderId);
  }

  let finalStatus = "PENDING";
  if (transactionStatus === "settlement" || transactionStatus === "capture") {
    finalStatus = "SUCCESS";
  } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
    finalStatus = "FAILED";
  } else if (transactionStatus === "expire") {
    finalStatus = "EXPIRED";
  }

  const [updatedRecord] = await db
    .update(donations)
    .set({ status: finalStatus, updatedAt: new Date() })
    .where(eq(donations.midtransOrderId, midtransOrderId))
    .returning();

  if (!updatedRecord) {
    throw new DonationNotFoundError(midtransOrderId);
  }

  return updatedRecord;
}
