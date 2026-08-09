import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Give stock media its own S3 folder.
 *
 * The cloud storage plugin builds the key as `{prefix}/{filename}`, so without
 * this the files land at the bucket root beside the tenant folders.
 *
 * Additive rather than folded into the schema migration, which preview
 * databases have already applied.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."stock_media"
      ADD COLUMN IF NOT EXISTS "prefix" varchar DEFAULT 'stock-media';
  `);

  // Rows created before the column existed keep their root-level key
  await db.execute(sql`
    UPDATE "payload"."stock_media"
      SET "prefix" = 'stock-media'
      WHERE "prefix" IS NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."stock_media" DROP COLUMN IF EXISTS "prefix";
  `);
}
