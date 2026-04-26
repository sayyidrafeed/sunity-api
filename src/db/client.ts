import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env.js";

// prepare: false required for edge/serverless environments (CF Workers, Bun)
const client = postgres(env.databaseUrl, { prepare: false });

export const db = drizzle({ client });
