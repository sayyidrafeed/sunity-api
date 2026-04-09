import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

if (!betterAuthSecret) {
  throw new Error("Missing BETTER_AUTH_SECRET in environment variables");
}

if (!betterAuthUrl) {
  throw new Error("Missing BETTER_AUTH_URL in environment variables");
}

if (!googleClientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID in environment variables");
}

if (!googleClientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET in environment variables");
}

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const adminSuccessRedirectPath = process.env.ADMIN_SUCCESS_REDIRECT_PATH ?? "/admin/dashboard";
const adminFailureRedirectPath = process.env.ADMIN_FAILURE_REDIRECT_PATH ?? "/admin/login";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl,
  betterAuthSecret,
  betterAuthUrl,
  googleClientId,
  googleClientSecret,
  adminEmails,
  adminSuccessRedirectPath,
  adminFailureRedirectPath,
};
