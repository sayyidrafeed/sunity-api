import { z } from "zod";

// Validasi parameter URL untuk ID Kampanye
export const campaignIdParamSchema = z.object({
  id: z.string().uuid("ID Campaign tidak valid"),
});

/**
 * Backend-aligned Schema untuk Donation Step 1
 * Menangani payload tepat seperti yang dikirim oleh Frontend
 */
export const createDonationSchema = z.object({
  nominal: z.coerce
    .number({ message: "Nominal donasi harus berupa angka" })
    .min(10000, { message: "Minimal nominal donasi adalah Rp10.000" }),
  name: z.string().max(100, { message: "Nama maksimal 100 karakter" }).optional().or(z.literal("")),
  email: z
    .string()
    .min(1, { message: "Email harus diisi" })
    .email({ message: "Format email tidak valid" }),
  hideName: z.boolean(),
});

export const listDonationsQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

// Response payload untuk inisiasi transaksi Midtrans Snap
export const donationResponseSchema = z.object({
  id: z.string().uuid(),
  midtransOrderId: z.string(),
  snapToken: z.string(),
  redirectUrl: z.string().url(),
});

export const donationListResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      donorName: z.string(),
      amountIdr: z.number(),
      isAnonymous: z.boolean(),
      createdAt: z.date(),
    }),
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
});

export const successResponseSchema = z.object({
  success: z.boolean(),
});

export const midtransWebhookPayloadSchema = z
  .object({
    order_id: z.string(),
    status_code: z.string(),
    gross_amount: z.string(),
    signature_key: z.string(),
    transaction_status: z.string(),
  })
  .passthrough();
