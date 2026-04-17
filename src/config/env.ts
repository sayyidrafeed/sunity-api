import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const frontendUrl = process.env.FRONTEND_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!databaseUrl) throw new Error("Missing DATABASE_URL");
if (!betterAuthSecret) throw new Error("Missing BETTER_AUTH_SECRET");
if (!betterAuthUrl) throw new Error("Missing BETTER_AUTH_URL");
if (!frontendUrl) throw new Error("Missing FRONTEND_URL");
if (!googleClientId) throw new Error("Missing GOOGLE_CLIENT_ID");
if (!googleClientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET");

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
  databaseUrl,
  betterAuthSecret,
  betterAuthUrl,
  frontendUrl,
  googleClientId,
  googleClientSecret,
};
