import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL in environment variables");
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl,
};
