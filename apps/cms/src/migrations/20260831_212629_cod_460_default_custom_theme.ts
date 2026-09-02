import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ALTER COLUMN "general_default_theme" SET DATA TYPE varchar;
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "general_default_theme" SET DEFAULT 'spotlight';
  ALTER TABLE "payload"."site_settings_rels" ADD COLUMN "custom_themes_id" integer;
  ALTER TABLE "payload"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_custom_themes_fk" FOREIGN KEY ("custom_themes_id") REFERENCES "payload"."custom_themes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_rels_custom_themes_id_idx" ON "payload"."site_settings_rels" USING btree ("custom_themes_id");
  DROP TYPE "payload"."enum_site_settings_default_theme";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_settings_default_theme" AS ENUM('shadcn', 'spotlight', 'codeware');
  ALTER TABLE "payload"."site_settings_rels" DROP CONSTRAINT "site_settings_rels_custom_themes_fk";
  
  DROP INDEX "payload"."site_settings_rels_custom_themes_id_idx";
  UPDATE "payload"."site_settings" SET "general_default_theme" = 'spotlight' WHERE "general_default_theme" NOT IN ('shadcn', 'spotlight', 'codeware');
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "general_default_theme" SET DEFAULT 'spotlight'::"payload"."enum_site_settings_default_theme";
  ALTER TABLE "payload"."site_settings" ALTER COLUMN "general_default_theme" SET DATA TYPE "payload"."enum_site_settings_default_theme" USING "general_default_theme"::"payload"."enum_site_settings_default_theme";
  ALTER TABLE "payload"."site_settings_rels" DROP COLUMN "custom_themes_id";`);
}
