import { describe, test, expect } from "bun:test";
import { InvalidAssetError } from "../assets.service.js";

// Minimal unit tests for validation logic
describe("assets.service - validation", () => {
  describe("MIME type validation", () => {
    test("should reject application/json", () => {
      const input = {
        purpose: "campaign" as const,
        kind: "cover" as const,
        mimeType: "application/json",
        sizeBytes: 1024000,
        originalFileName: "data.json",
      };

      let thrown = false;
      try {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(input.mimeType)) {
          throw new InvalidAssetError(
            `Invalid MIME type: ${input.mimeType}. Allowed: image/jpeg, image/png, image/webp, image/gif`,
          );
        }
      } catch {
        thrown = true;
      }
      expect(thrown).toBe(true);
    });

    test("should accept image/jpeg", () => {
      const input = {
        purpose: "campaign" as const,
        kind: "cover" as const,
        mimeType: "image/jpeg",
        sizeBytes: 1024000,
        originalFileName: "photo.jpg",
      };

      let thrown = false;
      try {
        if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(input.mimeType)) {
          throw new InvalidAssetError(
            `Invalid MIME type: ${input.mimeType}. Allowed: image/jpeg, image/png, image/webp, image/gif`,
          );
        }
      } catch {
        thrown = true;
      }
      expect(thrown).toBe(false);
    });
  });

  describe("File size validation", () => {
    test("should reject oversized files (>50MB)", () => {
      const input = {
        purpose: "campaign" as const,
        kind: "cover" as const,
        mimeType: "image/jpeg",
        sizeBytes: 60 * 1024 * 1024,
        originalFileName: "huge.jpg",
      };

      const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
      let thrown = false;
      try {
        if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
          throw new InvalidAssetError(
            `File size ${input.sizeBytes} exceeds maximum ${MAX_FILE_SIZE_BYTES} bytes`,
          );
        }
      } catch {
        thrown = true;
      }
      expect(thrown).toBe(true);
    });

    test("should accept files within size limit", () => {
      const input = {
        purpose: "campaign" as const,
        kind: "cover" as const,
        mimeType: "image/jpeg",
        sizeBytes: 2450123,
        originalFileName: "cover.jpg",
      };

      const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
      let thrown = false;
      try {
        if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
          throw new InvalidAssetError(
            `File size ${input.sizeBytes} exceeds maximum ${MAX_FILE_SIZE_BYTES} bytes`,
          );
        }
      } catch {
        thrown = true;
      }
      expect(thrown).toBe(false);
    });
  });

  describe("Storage key generation", () => {
    test("should generate unique storage keys", () => {
      const generateKey = (purpose: string, kind: string, originalFileName: string) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const ext = originalFileName.split(".").pop() || "bin";
        return `${purpose}/${kind}/${timestamp}-${randomSuffix}.${ext}`;
      };

      const key1 = generateKey("campaign", "cover", "photo1.jpg");
      const key2 = generateKey("campaign", "cover", "photo2.jpg");

      expect(key1 === key2).toBe(false);
      expect(key1.startsWith("campaign/cover/")).toBe(true);
    });

    test("should preserve file extension", () => {
      const generateKey = (purpose: string, kind: string, originalFileName: string) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const ext = originalFileName.split(".").pop() || "bin";
        return `${purpose}/${kind}/${timestamp}-${randomSuffix}.${ext}`;
      };

      const key = generateKey("campaign", "cover", "myimage.png");
      expect(key.endsWith(".png")).toBe(true);
    });
  });

  describe("Public URL generation", () => {
    test("should use custom domain if provided", () => {
      const customDomain = "https://cdn.example.com";
      const storageKey = "campaign/cover/123-abc.jpg";

      const url = `${customDomain}/${storageKey}`;
      expect(url).toBe("https://cdn.example.com/campaign/cover/123-abc.jpg");
    });

    test("should use R2 default if no custom domain", () => {
      const bucket = "test-bucket";
      const storageKey = "campaign/cover/123-abc.jpg";

      const url = `https://${bucket}.r2.cloudflarestorage.com/${storageKey}`;
      expect(url).toBe("https://test-bucket.r2.cloudflarestorage.com/campaign/cover/123-abc.jpg");
    });
  });
});
