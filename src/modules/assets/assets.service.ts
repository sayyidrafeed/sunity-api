import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { assets } from "../../db/schema/index.js";
import { env } from "../../env.js";
import type { z } from "zod";
import type { createAssetUploadSessionSchema } from "./assets.schema.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class AssetNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Asset not found", "ASSET_NOT_FOUND", id ? `assetId=${id}` : undefined);
  }
}

export class InvalidAssetError extends ValidationError {
  constructor(message: string) {
    super(message, "INVALID_ASSET");
  }
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const s3Client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
});

function validateUploadInput(input: z.infer<typeof createAssetUploadSessionSchema>) {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new InvalidAssetError(
      `Invalid MIME type: ${input.mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new InvalidAssetError(
      `File size ${input.sizeBytes} exceeds maximum ${MAX_FILE_SIZE_BYTES} bytes`,
    );
  }
}

function generateStorageKey(purpose: string, kind: string, originalFileName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = originalFileName.split(".").pop() || "bin";
  return `${purpose}/${kind}/${timestamp}-${randomSuffix}.${ext}`;
}

function computePublicUrl(storageKey: string): string {
  if (env.r2CustomDomain) {
    return `${env.r2CustomDomain}/${storageKey}`;
  }
  return `https://${env.r2BucketName}.r2.cloudflarestorage.com/${storageKey}`;
}

export async function createAssetUploadSession(
  input: z.infer<typeof createAssetUploadSessionSchema>,
) {
  validateUploadInput(input);

  const storageKey = generateStorageKey(input.purpose, input.kind, input.originalFileName);

  // Create asset record
  const [asset] = await db
    .insert(assets)
    .values({
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
    .returning();

  if (!asset) throw new InvalidAssetError("Failed to create asset record");

  // Generate signed upload URL (expires in 1 hour)
  const uploadUrl = await getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: storageKey,
      ContentType: input.mimeType,
      ContentLength: input.sizeBytes,
    }),
    { expiresIn: 3600 },
  );

  return {
    assetId: asset.id,
    storageKey: asset.storageKey,
    publicUrl: computePublicUrl(storageKey),
    upload: {
      method: "PUT",
      url: uploadUrl,
      headers: {
        "Content-Type": input.mimeType,
      },
      expiresAt: new Date(Date.now() + 3600 * 1000),
    },
  };
}

export async function getAssetById(id: string) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));
  return asset ?? null;
}

export async function getAssetByStorageKey(storageKey: string) {
  const [asset] = await db.select().from(assets).where(eq(assets.storageKey, storageKey));
  return asset ?? null;
}
