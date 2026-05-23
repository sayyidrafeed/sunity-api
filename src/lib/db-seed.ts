import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { NewUser } from "../db/schema/index.js";
import type { NewDonation } from "../db/schema/index.js";
import { users, donations } from "../db/schema/index.js";

/**
 * Upsert users by email to ensure idempotent seeding.
 * Updates existing users if email matches, inserts new ones.
 */
export async function upsertUsersByEmail(
  db: PostgresJsDatabase,
  seedUsers: NewUser[],
): Promise<(typeof users.$inferSelect)[]> {
  const results: (typeof users.$inferSelect)[] = [];

  for (const user of seedUsers) {
    const [upserted] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      })
      .returning();

    if (upserted) {
      results.push(upserted);
    }
  }

  return results;
}

/**
 * Upsert donations by midtransOrderId to ensure idempotent seeding.
 * Uses onConflictDoNothing since donations are immutable records.
 */
export async function upsertDonationsByMidtransId(
  db: PostgresJsDatabase,
  seedDonations: NewDonation[],
): Promise<void> {
  for (const donation of seedDonations) {
    await db.insert(donations).values(donation).onConflictDoNothing({
      target: donations.midtransOrderId,
    });
  }
}

/**
 * Find user by email (used when donations need to reference a user).
 */
export async function findUserByEmail(
  db: PostgresJsDatabase,
  email: string,
): Promise<typeof users.$inferSelect | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  return user ?? null;
}
