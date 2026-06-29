import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_settings_general_icon_source" AS ENUM('svg', 'upload');
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_icon_source" "payload"."enum_site_settings_general_icon_source";
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_icon_svg_code" varchar;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_icon_file_id" integer;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_general_icon_file_id_media_id_fk" FOREIGN KEY ("general_icon_file_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_general_icon_general_icon_file_idx" ON "payload"."site_settings" USING btree ("general_icon_file_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" DROP CONSTRAINT "site_settings_general_icon_file_id_media_id_fk";

  DROP INDEX "payload"."site_settings_general_icon_general_icon_file_idx";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_icon_source";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_icon_svg_code";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_icon_file_id";
  DROP TYPE "payload"."enum_site_settings_general_icon_source";`);
}
