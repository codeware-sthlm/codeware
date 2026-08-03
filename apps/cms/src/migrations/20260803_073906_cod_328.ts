import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_footer_contact_platform" AS ENUM('discord', 'email', 'facebook', 'github', 'instagram', 'linkedin', 'npm', 'phone', 'web', 'x', 'youtube');
  CREATE TYPE "payload"."enum_footer_link_source" AS ENUM('navigation', 'custom', 'none');
  CREATE TABLE "payload"."site_settings_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar
  );
  
  CREATE TABLE "payload"."site_settings_footer_links_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_footer_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_footer_contact_platform",
  	"email" varchar,
  	"phone" varchar,
  	"url" varchar,
  	"with_label" boolean,
  	"label" varchar
  );
  
  CREATE TABLE "payload"."site_settings_locales" (
  	"footer_tagline" varchar,
  	"footer_copyright" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."site_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  
  ALTER TABLE "payload"."site_settings" ADD COLUMN "footer_enabled" boolean DEFAULT true;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "footer_link_source" "payload"."enum_footer_link_source" DEFAULT 'navigation';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "footer_show_version" boolean;
  ALTER TABLE "payload"."site_settings_footer_links" ADD CONSTRAINT "site_settings_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_links_locales" ADD CONSTRAINT "site_settings_footer_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings_footer_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_footer_contact" ADD CONSTRAINT "site_settings_footer_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings_rels" ADD CONSTRAINT "site_settings_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_footer_links_order_idx" ON "payload"."site_settings_footer_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_links_parent_id_idx" ON "payload"."site_settings_footer_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_footer_links_locales_locale_parent_id_unique" ON "payload"."site_settings_footer_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_footer_contact_order_idx" ON "payload"."site_settings_footer_contact" USING btree ("_order");
  CREATE INDEX "site_settings_footer_contact_parent_id_idx" ON "payload"."site_settings_footer_contact" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "payload"."site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_rels_order_idx" ON "payload"."site_settings_rels" USING btree ("order");
  CREATE INDEX "site_settings_rels_parent_idx" ON "payload"."site_settings_rels" USING btree ("parent_id");
  CREATE INDEX "site_settings_rels_path_idx" ON "payload"."site_settings_rels" USING btree ("path");
  CREATE INDEX "site_settings_rels_pages_id_idx" ON "payload"."site_settings_rels" USING btree ("pages_id");
  CREATE INDEX "site_settings_rels_posts_id_idx" ON "payload"."site_settings_rels" USING btree ("posts_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_settings_footer_links" CASCADE;
  DROP TABLE "payload"."site_settings_footer_links_locales" CASCADE;
  DROP TABLE "payload"."site_settings_footer_contact" CASCADE;
  DROP TABLE "payload"."site_settings_locales" CASCADE;
  DROP TABLE "payload"."site_settings_rels" CASCADE;
  ALTER TABLE "payload"."site_settings" DROP COLUMN "footer_enabled";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "footer_link_source";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "footer_show_version";
  DROP TYPE "payload"."enum_footer_contact_platform";
  DROP TYPE "payload"."enum_footer_link_source";`);
}
