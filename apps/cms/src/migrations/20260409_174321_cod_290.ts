import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE SCHEMA IF NOT EXISTS "payload";

  CREATE TYPE "payload"."enum_site_settings_general_default_locale" AS ENUM('en', 'sv');
  CREATE TYPE "payload"."enum_tenant_supported_locales" AS ENUM('en', 'sv');
  CREATE TABLE "payload"."pages_blocks_card_cards_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"content" varchar NOT NULL,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_content_columns_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."reusable_content_blocks_content_columns_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."tenants_supported_locales" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_tenant_supported_locales",
  	"id" serial PRIMARY KEY NOT NULL
  );

  ALTER TABLE "payload"."reusable_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tenants_domains_page_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tenants_domains" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."reusable_content_locales" CASCADE;
  DROP TABLE "payload"."tenants_domains_page_types" CASCADE;
  DROP TABLE "payload"."tenants_domains" CASCADE;
  DROP INDEX "payload"."pages_blocks_card_cards_locale_idx";
  DROP INDEX "payload"."pages_blocks_card_locale_idx";
  DROP INDEX "payload"."pages_blocks_form_locale_idx";
  DROP INDEX "payload"."pages_blocks_image_locale_idx";
  DROP INDEX "payload"."pages_blocks_media_locale_idx";
  DROP INDEX "payload"."pages_blocks_code_locale_idx";
  DROP INDEX "payload"."pages_blocks_reusable_content_locale_idx";
  DROP INDEX "payload"."pages_blocks_social_media_social_locale_idx";
  DROP INDEX "payload"."pages_blocks_social_media_locale_idx";
  DROP INDEX "payload"."pages_blocks_spacing_locale_idx";
  DROP INDEX "payload"."pages_blocks_content_columns_locale_idx";
  DROP INDEX "payload"."pages_blocks_content_locale_idx";
  DROP INDEX "payload"."pages_blocks_file_area_locale_idx";
  DROP INDEX "payload"."pages_rels_locale_idx";
  DROP INDEX "payload"."pages_rels_pages_id_idx";
  DROP INDEX "payload"."pages_rels_posts_id_idx";
  DROP INDEX "payload"."pages_rels_tags_id_idx";
  ALTER TABLE "payload"."reusable_content" ADD COLUMN "title" varchar NOT NULL DEFAULT '';
  ALTER TABLE "payload"."site_settings" ADD COLUMN "general_default_locale" "payload"."enum_site_settings_general_default_locale" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_card_cards_locales" ADD CONSTRAINT "pages_blocks_card_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_card_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_content_columns_locales" ADD CONSTRAINT "pages_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."reusable_content_blocks_content_columns_locales" ADD CONSTRAINT "reusable_content_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reusable_content_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tenants_supported_locales" ADD CONSTRAINT "tenants_supported_locales_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "pages_blocks_card_cards_locales_locale_parent_id_unique" ON "payload"."pages_blocks_card_cards_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_content_columns_locales_locale_parent_id_unique" ON "payload"."pages_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "reusable_content_blocks_content_columns_locales_locale_paren" ON "payload"."reusable_content_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tenants_supported_locales_order_idx" ON "payload"."tenants_supported_locales" USING btree ("order");
  CREATE INDEX "tenants_supported_locales_parent_idx" ON "payload"."tenants_supported_locales" USING btree ("parent_id");
  CREATE INDEX "pages_rels_pages_id_idx" ON "payload"."pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_posts_id_idx" ON "payload"."pages_rels" USING btree ("posts_id");
  CREATE INDEX "pages_rels_tags_id_idx" ON "payload"."pages_rels" USING btree ("tags_id");
  ALTER TABLE "payload"."pages_blocks_card_cards" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_card_cards" DROP COLUMN "title";
  ALTER TABLE "payload"."pages_blocks_card_cards" DROP COLUMN "description";
  ALTER TABLE "payload"."pages_blocks_card_cards" DROP COLUMN "content";
  ALTER TABLE "payload"."pages_blocks_card_cards" DROP COLUMN "link_label";
  ALTER TABLE "payload"."pages_blocks_card" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_form" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_image" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_media" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_code" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_reusable_content" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_social_media_social" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_social_media" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_spacing" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_content_columns" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_content_columns" DROP COLUMN "rich_text";
  ALTER TABLE "payload"."pages_blocks_content" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages_blocks_file_area" DROP COLUMN "_locale";
  ALTER TABLE "payload"."pages" DROP COLUMN "published_at";
  ALTER TABLE "payload"."pages_rels" DROP COLUMN "locale";
  ALTER TABLE "payload"."posts" DROP COLUMN "published_at";
  ALTER TABLE "payload"."reusable_content_blocks_content_columns" DROP COLUMN "rich_text";
  DROP TYPE "payload"."enum_tenant_domain_page_type";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_tenant_domain_page_type" AS ENUM('cms', 'client', 'disabled');
  CREATE TABLE "payload"."reusable_content_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."tenants_domains_page_types" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "payload"."enum_tenant_domain_page_type",
  	"id" serial PRIMARY KEY NOT NULL
  );

  CREATE TABLE "payload"."tenants_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );

  ALTER TABLE "payload"."pages_blocks_card_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."reusable_content_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tenants_supported_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."pages_blocks_card_cards_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_content_columns_locales" CASCADE;
  DROP TABLE "payload"."reusable_content_blocks_content_columns_locales" CASCADE;
  DROP TABLE "payload"."tenants_supported_locales" CASCADE;
  DROP INDEX "payload"."pages_rels_pages_id_idx";
  DROP INDEX "payload"."pages_rels_posts_id_idx";
  DROP INDEX "payload"."pages_rels_tags_id_idx";
  ALTER TABLE "payload"."pages_blocks_card_cards" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_card_cards" ADD COLUMN "title" varchar NOT NULL DEFAULT '';
  ALTER TABLE "payload"."pages_blocks_card_cards" ADD COLUMN "description" varchar;
  ALTER TABLE "payload"."pages_blocks_card_cards" ADD COLUMN "content" varchar NOT NULL DEFAULT '';
  ALTER TABLE "payload"."pages_blocks_card_cards" ADD COLUMN "link_label" varchar;
  ALTER TABLE "payload"."pages_blocks_card" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_form" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_image" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_media" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_code" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_reusable_content" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_social_media_social" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_social_media" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_spacing" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_content_columns" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_content_columns" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "payload"."pages_blocks_content" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages_blocks_file_area" ADD COLUMN "_locale" "payload"."_locales" NOT NULL DEFAULT 'en';
  ALTER TABLE "payload"."pages" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."pages_rels" ADD COLUMN "locale" "payload"."_locales";
  ALTER TABLE "payload"."posts" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."reusable_content_blocks_content_columns" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "payload"."reusable_content_locales" ADD CONSTRAINT "reusable_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tenants_domains_page_types" ADD CONSTRAINT "tenants_domains_page_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tenants_domains"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "reusable_content_locales_locale_parent_id_unique" ON "payload"."reusable_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tenants_domains_page_types_order_idx" ON "payload"."tenants_domains_page_types" USING btree ("order");
  CREATE INDEX "tenants_domains_page_types_parent_idx" ON "payload"."tenants_domains_page_types" USING btree ("parent_id");
  CREATE INDEX "tenants_domains_order_idx" ON "payload"."tenants_domains" USING btree ("_order");
  CREATE INDEX "tenants_domains_parent_id_idx" ON "payload"."tenants_domains" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_card_cards_locale_idx" ON "payload"."pages_blocks_card_cards" USING btree ("_locale");
  CREATE INDEX "pages_blocks_card_locale_idx" ON "payload"."pages_blocks_card" USING btree ("_locale");
  CREATE INDEX "pages_blocks_form_locale_idx" ON "payload"."pages_blocks_form" USING btree ("_locale");
  CREATE INDEX "pages_blocks_image_locale_idx" ON "payload"."pages_blocks_image" USING btree ("_locale");
  CREATE INDEX "pages_blocks_media_locale_idx" ON "payload"."pages_blocks_media" USING btree ("_locale");
  CREATE INDEX "pages_blocks_code_locale_idx" ON "payload"."pages_blocks_code" USING btree ("_locale");
  CREATE INDEX "pages_blocks_reusable_content_locale_idx" ON "payload"."pages_blocks_reusable_content" USING btree ("_locale");
  CREATE INDEX "pages_blocks_social_media_social_locale_idx" ON "payload"."pages_blocks_social_media_social" USING btree ("_locale");
  CREATE INDEX "pages_blocks_social_media_locale_idx" ON "payload"."pages_blocks_social_media" USING btree ("_locale");
  CREATE INDEX "pages_blocks_spacing_locale_idx" ON "payload"."pages_blocks_spacing" USING btree ("_locale");
  CREATE INDEX "pages_blocks_content_columns_locale_idx" ON "payload"."pages_blocks_content_columns" USING btree ("_locale");
  CREATE INDEX "pages_blocks_content_locale_idx" ON "payload"."pages_blocks_content" USING btree ("_locale");
  CREATE INDEX "pages_blocks_file_area_locale_idx" ON "payload"."pages_blocks_file_area" USING btree ("_locale");
  CREATE INDEX "pages_rels_locale_idx" ON "payload"."pages_rels" USING btree ("locale");
  CREATE INDEX "pages_rels_pages_id_idx" ON "payload"."pages_rels" USING btree ("pages_id","locale");
  CREATE INDEX "pages_rels_posts_id_idx" ON "payload"."pages_rels" USING btree ("posts_id","locale");
  CREATE INDEX "pages_rels_tags_id_idx" ON "payload"."pages_rels" USING btree ("tags_id","locale");
  ALTER TABLE "payload"."reusable_content" DROP COLUMN "title";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "general_default_locale";
  DROP TYPE "payload"."enum_site_settings_general_default_locale";
  DROP TYPE "payload"."enum_tenant_supported_locales";
  `);
}
