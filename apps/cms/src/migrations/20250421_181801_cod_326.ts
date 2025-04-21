import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" RENAME COLUMN "sizes_og_url" TO "sizes_meta_url";
  ALTER TABLE "media" RENAME COLUMN "sizes_og_width" TO "sizes_meta_width";
  ALTER TABLE "media" RENAME COLUMN "sizes_og_height" TO "sizes_meta_height";
  ALTER TABLE "media" RENAME COLUMN "sizes_og_mime_type" TO "sizes_meta_mime_type";
  ALTER TABLE "media" RENAME COLUMN "sizes_og_filename" TO "sizes_meta_filename";
  ALTER TABLE "media" RENAME COLUMN "sizes_og_filesize" TO "sizes_meta_filesize";
  DROP INDEX IF EXISTS "media_sizes_square_sizes_square_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  CREATE INDEX IF NOT EXISTS "media_sizes_meta_sizes_meta_filename_idx" ON "media" USING btree ("sizes_meta_filename");
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filename";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" RENAME COLUMN "sizes_meta_url" TO "sizes_og_url";
  ALTER TABLE "media" RENAME COLUMN "sizes_meta_width" TO "sizes_og_width";
  ALTER TABLE "media" RENAME COLUMN "sizes_meta_height" TO "sizes_og_height";
  ALTER TABLE "media" RENAME COLUMN "sizes_meta_mime_type" TO "sizes_og_mime_type";
  ALTER TABLE "media" RENAME COLUMN "sizes_meta_filesize" TO "sizes_og_filesize";
  ALTER TABLE "media" RENAME COLUMN "sizes_meta_filename" TO "sizes_og_filename";
  DROP INDEX IF EXISTS "media_sizes_meta_sizes_meta_filename_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "media" ADD COLUMN "sizes_square_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filename" varchar;
  CREATE INDEX IF NOT EXISTS "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");`);
}
