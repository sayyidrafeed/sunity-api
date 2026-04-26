import "dotenv/config";
import { z } from "zod";

const commaSeparated = z
  .string()
  .min(1)
  .transform((v) =>
    v
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean),
  );

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().url().optional(),
  FRONTEND_URLS: commaSeparated.optional(),
  BETTER_AUTH_EXTRA_TRUSTED_ORIGINS: commaSeparated.optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. See errors above.");
}

const raw = parsed.data;

const frontendUrls = (() => {
  if (raw.FRONTEND_URLS && raw.FRONTEND_URLS.length > 0) return raw.FRONTEND_URLS;
  if (raw.FRONTEND_URL) return [raw.FRONTEND_URL];
  return [];
})();

if (frontendUrls.length === 0) {
  throw new Error("Missing FRONTEND_URL or FRONTEND_URLS");
}

export const env = {
  port: raw.PORT,
  nodeEnv: raw.NODE_ENV,
  databaseUrl: raw.DATABASE_URL,
  betterAuthUrl: raw.BETTER_AUTH_URL,
  betterAuthSecret: raw.BETTER_AUTH_SECRET,
  frontendUrl: raw.FRONTEND_URL,
  frontendUrls,
  betterAuthExtraTrustedOrigins: raw.BETTER_AUTH_EXTRA_TRUSTED_ORIGINS ?? [],
  googleClientId: raw.GOOGLE_CLIENT_ID,
  googleClientSecret: raw.GOOGLE_CLIENT_SECRET,
};

export type Env = typeof env;
