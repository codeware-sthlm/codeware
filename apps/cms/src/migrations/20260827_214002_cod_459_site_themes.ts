import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_site_settings_themes" AS ENUM('shadcn', 'spotlight', 'codeware');
  CREATE TYPE "payload"."enum_site_settings_default_theme" AS ENUM('shadcn', 'spotlight', 'codeware');
  CREATE TYPE "payload"."enum_site_settings_color_scheme" AS ENUM('system', 'light', 'dark');
  CREATE TABLE "payload"."site_settings_general_themes" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_site_settings_themes",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_default_theme" "payload"."enum_site_settings_default_theme" DEFAULT 'spotlight' NOT NULL;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_color_scheme" "payload"."enum_site_settings_color_scheme" DEFAULT 'system' NOT NULL;
  ALTER TABLE "payload"."site_settings_general_themes" ADD CONSTRAINT "site_settings_general_themes_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_general_themes_order_idx" ON "payload"."site_settings_general_themes" USING btree ("order");
  CREATE INDEX "site_settings_general_themes_parent_idx" ON "payload"."site_settings_general_themes" USING btree ("parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_settings_general_themes" CASCADE;
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_default_theme";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_color_scheme";
  DROP TYPE "payload"."enum_site_settings_themes";
  DROP TYPE "payload"."enum_site_settings_default_theme";
  DROP TYPE "payload"."enum_site_settings_color_scheme";`);
}
