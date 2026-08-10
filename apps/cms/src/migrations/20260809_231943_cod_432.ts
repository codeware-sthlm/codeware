import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Track when a form submission was first read.
 *
 * Null means unread, which is what the dashboard's message count and the
 * submissions list filter on. Existing submissions stay null — they have never
 * been opened in a view that could record it.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."form_submissions"
      ADD COLUMN IF NOT EXISTS "read_at" timestamp(3) with time zone;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "form_submissions_read_at_idx"
      ON "payload"."form_submissions" USING btree ("read_at");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload"."form_submissions_read_at_idx";
  `);

  await db.execute(sql`
    ALTER TABLE "payload"."form_submissions" DROP COLUMN IF EXISTS "read_at";
  `);
}
