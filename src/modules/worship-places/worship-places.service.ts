import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import { worshipPlaces } from "../../db/schema/index.js";
import type { z } from "zod";
import type {
  createWorshipPlaceSchema,
  listWorshipPlacesQuerySchema,
  updateWorshipPlaceSchema,
} from "./worship-places.schema.js";
import { NotFoundError } from "../../lib/errors.js";

export class WorshipPlaceNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Worship place not found", "WORSHIP_PLACE_NOT_FOUND", id ? `id=${id}` : undefined);
  }
}

export async function listWorshipPlaces(query: z.infer<typeof listWorshipPlacesQuerySchema>) {
  const { page, limit, search, city } = query;
  const offset = (page - 1) * limit;
  const conditions = [];

  if (search) {
    conditions.push(
      or(ilike(worshipPlaces.name, `%${search}%`), ilike(worshipPlaces.city, `%${search}%`)),
    );
  }

  if (city) conditions.push(ilike(worshipPlaces.city, `%${city}%`));

  const where = conditions.length ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(worshipPlaces).where(where).limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(worshipPlaces)
      .where(where),
  ]);

  return {
    data,
    total: Number(countResult[0].count),
    page,
    limit,
  };
}

export async function getWorshipPlaceById(id: string) {
  const [place] = await db.select().from(worshipPlaces).where(eq(worshipPlaces.id, id));
  if (!place) throw new WorshipPlaceNotFoundError(id);
  return place;
}

export async function createWorshipPlace(data: z.infer<typeof createWorshipPlaceSchema>) {
  const [place] = await db.insert(worshipPlaces).values(data).returning();
  return place;
}

export async function updateWorshipPlace(
  id: string,
  data: z.infer<typeof updateWorshipPlaceSchema>,
) {
  const [place] = await db
    .update(worshipPlaces)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(worshipPlaces.id, id))
    .returning();
  if (!place) throw new WorshipPlaceNotFoundError(id);
  return place;
}
