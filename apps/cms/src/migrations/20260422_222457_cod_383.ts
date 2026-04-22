import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."media_filename_idx";
  ALTER TABLE "payload"."media" ADD COLUMN "filename_without_prefix" varchar;
  ALTER TABLE "payload"."media" ADD COLUMN "prefix" varchar;
  UPDATE "payload"."media" SET "filename_without_prefix" = "filename" WHERE "filename_without_prefix" IS NULL;
  CREATE UNIQUE INDEX "media_filename_compound_idx" ON "payload"."media" USING btree ("filename","prefix");
  CREATE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload"."media_filename_compound_idx";
  DROP INDEX "payload"."media_filename_idx";
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  ALTER TABLE "payload"."media" DROP COLUMN "filename_without_prefix";
  ALTER TABLE "payload"."media" DROP COLUMN "prefix";`);
}
