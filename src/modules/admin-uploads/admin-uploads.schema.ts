import { z } from "zod";

export const createAdminAssetUploadSessionSchema = z.object({
  purpose: z.enum(["campaign"]).openapi({ example: "campaign" }),
  kind: z
    .enum(["cover", "gallery", "transparency", "installation", "report"])
    .openapi({ example: "cover" }),
  mimeType: z.string().openapi({ example: "image/jpeg" }),
  sizeBytes: z.number().int().positive().openapi({ example: 2450123 }),
  originalFileName: z.string().min(1).openapi({ example: "cover.jpg" }),
});

export const adminAssetUploadSessionResponseSchema = z.object({
  assetId: z.string().uuid().openapi({ example: "123e4567-e89b-12d3-a456-426614174000" }),
  storageKey: z.string().openapi({ example: "campaign/cover/1234567890-abc123.jpg" }),
  publicUrl: z.string().url().openapi({ example: "https://cdn.example.com/campaign/cover/..." }),
  upload: z.object({
    method: z.string().openapi({ example: "PUT" }),
    url: z.string().url().openapi({ example: "https://r2-signed-url..." }),
    headers: z.record(z.string(), z.string()),
    expiresAt: z.string().datetime().openapi({ example: "2025-12-31T00:00:00Z" }),
  }),
});
