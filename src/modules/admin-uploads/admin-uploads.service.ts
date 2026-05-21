import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../../db/client.js";
import { assets } from "../../db/schema/index.js";
import { env } from "../../env.js";
import { ValidationError } from "../../lib/errors.js";
import type { z } from "zod";
import type { createAdminAssetUploadSessionSchema } from "./admin-uploads.schema.js";

export class InvalidAdminAssetUploadError extends ValidationError {
  constructor(message: string) {
    super(message, "INVALID_ADMIN_ASSET_UPLOAD");
  }
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const s3Client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
});

function validateUploadInput(input: z.infer<typeof createAdminAssetUploadSessionSchema>) {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new InvalidAdminAssetUploadError(
      `Invalid MIME type: ${input.mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
    );
  }

  if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new InvalidAdminAssetUploadError(
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

export async function createAdminAssetUploadSession(
  input: z.infer<typeof createAdminAssetUploadSessionSchema>,
) {
  validateUploadInput(input);

  const storageKey = generateStorageKey(input.purpose, input.kind, input.originalFileName);

  const [asset] = await db
    .insert(assets)
    .values({
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
    .returning();

  if (!asset) throw new InvalidAdminAssetUploadError("Failed to create asset record");

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
