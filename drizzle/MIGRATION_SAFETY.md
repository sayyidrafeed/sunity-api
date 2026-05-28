# Migration Safety Notes

This document records known risks in historical migrations and the corrective
policies adopted going forward. These migrations have already been applied
successfully. They are NOT rewritten to avoid breaking the Drizzle migration
journal.

## Known Historical Risks

### 0004_smart_ben_urich.sql

**Risk:** `ALTER COLUMN "id" SET DATA TYPE uuid` without an explicit
`USING id::uuid` cast.

**Context:** PostgreSQL requires a `USING` clause when the source type cannot be
implicitly cast to the target type. If any `campaigns.id` value was not a valid
UUID string at the time this migration ran, it would have failed.

**Status:** Migration applied successfully — all `id` values were already valid
UUIDs when this ran. No corrective action needed.

### 0006_medical_scalphunter.sql

**Risk 1:** `ADD COLUMN "worship_place_id" uuid NOT NULL` on a table that may
contain existing rows. PostgreSQL cannot add a NOT NULL column without a default
value when the table already has data.

**Risk 2:** `ALTER COLUMN "target_idr" SET DATA TYPE bigint`,
`ALTER COLUMN "raised_idr" SET DATA TYPE bigint`,
`ALTER COLUMN "estimated_idr_savings" SET DATA TYPE bigint` — converting
`numeric` columns to `bigint` truncates fractional values without warning.

**Context:** The `campaigns` table was either empty or was wiped and re-seeded
before this migration ran. All deployment data is reproduced via `bun run db:seed`.

**Status:** Migration applied successfully. No corrective action needed.

## Policy Going Forward

All future migrations MUST follow these rules:

1. **Type changes:** Always include an explicit `USING column::new_type` cast.
   Never rely on PostgreSQL's implicit casting.

2. **NOT NULL columns:** Add new required columns in stages:
   - Step 1: `ADD COLUMN ... DEFAULT value` or `ADD COLUMN ... NULL`
   - Step 2: Backfill data
   - Step 3: `ALTER COLUMN ... SET NOT NULL` (only after all rows have values)

3. **Precision changes:** When changing numeric types (e.g. `numeric` → `bigint`),
   validate that existing data fits within the target type's range and precision.

4. **Constraint additions:** Verify existing data satisfies the constraint before
   adding it. For unique constraints, check for duplicates first:

   ```sql
   SELECT campaign_id, month, COUNT(*)
   FROM energy_data
   GROUP BY campaign_id, month
   HAVING COUNT(*) > 1;
   ```

5. **Foreign keys:** Add foreign key constraints only after verifying referential
   integrity with existing data.

6. **Enum migrations:** When converting `text`/`varchar` columns to `pgEnum` types,
   always include `USING column::enum_type` in the `ALTER COLUMN SET DATA TYPE`
   statement.
