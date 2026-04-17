import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_published_locale" AS ENUM('en', 'sv');
  CREATE TYPE "payload"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__posts_v_published_locale" AS ENUM('en', 'sv');
  CREATE TABLE "payload"."_pages_v_blocks_card_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_icon" varchar,
  	"brand_color" varchar,
  	"enable_link" boolean,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_nav_trigger" "payload"."enum_nav_trigger" DEFAULT 'card',
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_card_cards_locales" (
  	"title" varchar,
  	"description" varchar,
  	"content" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"enable_intro" boolean,
  	"intro_content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_code" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "payload"."enum_code_language" DEFAULT 'ts',
  	"code" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_reusable_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"reusable_content_id" integer,
  	"ref_id" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_social_media_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_social_media_platform",
  	"email" varchar,
  	"phone" varchar,
  	"url" varchar,
  	"with_label" boolean,
  	"label" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_social_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"direction" "payload"."enum_social_media_direction" DEFAULT 'horizontal',
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_spacing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "payload"."enum_spacing_size" DEFAULT 'regular',
  	"divider" boolean,
  	"color" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "payload"."enum_content_column_size" DEFAULT 'full',
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_content_columns_locales" (
  	"rich_text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_file_area" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 10,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_posts_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );

  CREATE TABLE "payload"."_pages_v_locales" (
  	"version_name" varchar,
  	"version_header" varchar DEFAULT '',
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"tags_id" integer
  );

  CREATE TABLE "payload"."_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_hero_image_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__posts_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );

  CREATE TABLE "payload"."_posts_v_locales" (
  	"version_title" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"users_id" integer
  );

  ALTER TABLE "payload"."pages_blocks_card_cards_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_card_cards_locales" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_form" ALTER COLUMN "form_id" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_image" ALTER COLUMN "media_id" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_media" ALTER COLUMN "media_id" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_code" ALTER COLUMN "language" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_code" ALTER COLUMN "code" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_reusable_content" ALTER COLUMN "reusable_content_id" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_social_media_social" ALTER COLUMN "platform" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_spacing" ALTER COLUMN "size" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_posts" ALTER COLUMN "limit" DROP NOT NULL;
  ALTER TABLE "payload"."pages_blocks_posts_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "payload"."pages_locales" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "payload"."posts_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "payload"."posts_locales" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "payload"."pages" ADD COLUMN "_status" "payload"."enum_pages_status" DEFAULT 'draft';
  ALTER TABLE "payload"."posts" ADD COLUMN "_status" "payload"."enum_posts_status" DEFAULT 'draft';
  ALTER TABLE "payload"."_pages_v_blocks_card_cards" ADD CONSTRAINT "_pages_v_blocks_card_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_card_cards_locales" ADD CONSTRAINT "_pages_v_blocks_card_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_card_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_card" ADD CONSTRAINT "_pages_v_blocks_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_form" ADD CONSTRAINT "_pages_v_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "payload"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_form" ADD CONSTRAINT "_pages_v_blocks_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_image" ADD CONSTRAINT "_pages_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_media" ADD CONSTRAINT "_pages_v_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_code" ADD CONSTRAINT "_pages_v_blocks_code_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_reusable_content" ADD CONSTRAINT "_pages_v_blocks_reusable_content_reusable_content_id_reusable_content_id_fk" FOREIGN KEY ("reusable_content_id") REFERENCES "payload"."reusable_content"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_reusable_content" ADD CONSTRAINT "_pages_v_blocks_reusable_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_social_media_social" ADD CONSTRAINT "_pages_v_blocks_social_media_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_social_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_social_media" ADD CONSTRAINT "_pages_v_blocks_social_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_spacing" ADD CONSTRAINT "_pages_v_blocks_spacing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_content_columns" ADD CONSTRAINT "_pages_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_content_columns_locales" ADD CONSTRAINT "_pages_v_blocks_content_columns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_content_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_file_area" ADD CONSTRAINT "_pages_v_blocks_file_area_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_posts" ADD CONSTRAINT "_pages_v_blocks_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_posts_locales" ADD CONSTRAINT "_pages_v_blocks_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "payload"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_pages_v_blocks_card_cards_order_idx" ON "payload"."_pages_v_blocks_card_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_cards_parent_id_idx" ON "payload"."_pages_v_blocks_card_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_card_cards_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_card_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_card_order_idx" ON "payload"."_pages_v_blocks_card" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_card_parent_id_idx" ON "payload"."_pages_v_blocks_card" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_card_path_idx" ON "payload"."_pages_v_blocks_card" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_order_idx" ON "payload"."_pages_v_blocks_form" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_parent_id_idx" ON "payload"."_pages_v_blocks_form" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_path_idx" ON "payload"."_pages_v_blocks_form" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_form_idx" ON "payload"."_pages_v_blocks_form" USING btree ("form_id");
  CREATE INDEX "_pages_v_blocks_image_order_idx" ON "payload"."_pages_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_image_parent_id_idx" ON "payload"."_pages_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_image_path_idx" ON "payload"."_pages_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_image_media_idx" ON "payload"."_pages_v_blocks_image" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_media_order_idx" ON "payload"."_pages_v_blocks_media" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_parent_id_idx" ON "payload"."_pages_v_blocks_media" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_path_idx" ON "payload"."_pages_v_blocks_media" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_media_idx" ON "payload"."_pages_v_blocks_media" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_code_order_idx" ON "payload"."_pages_v_blocks_code" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_code_parent_id_idx" ON "payload"."_pages_v_blocks_code" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_code_path_idx" ON "payload"."_pages_v_blocks_code" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_reusable_content_order_idx" ON "payload"."_pages_v_blocks_reusable_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_reusable_content_parent_id_idx" ON "payload"."_pages_v_blocks_reusable_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_reusable_content_path_idx" ON "payload"."_pages_v_blocks_reusable_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_reusable_content_reusable_content_idx" ON "payload"."_pages_v_blocks_reusable_content" USING btree ("reusable_content_id");
  CREATE INDEX "_pages_v_blocks_social_media_social_order_idx" ON "payload"."_pages_v_blocks_social_media_social" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_media_social_parent_id_idx" ON "payload"."_pages_v_blocks_social_media_social" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_media_order_idx" ON "payload"."_pages_v_blocks_social_media" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_social_media_parent_id_idx" ON "payload"."_pages_v_blocks_social_media" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_social_media_path_idx" ON "payload"."_pages_v_blocks_social_media" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_spacing_order_idx" ON "payload"."_pages_v_blocks_spacing" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_spacing_parent_id_idx" ON "payload"."_pages_v_blocks_spacing" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_spacing_path_idx" ON "payload"."_pages_v_blocks_spacing" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_columns_order_idx" ON "payload"."_pages_v_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_columns_parent_id_idx" ON "payload"."_pages_v_blocks_content_columns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_content_columns_locales_locale_parent_id_uni" ON "payload"."_pages_v_blocks_content_columns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "payload"."_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_file_area_order_idx" ON "payload"."_pages_v_blocks_file_area" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_file_area_parent_id_idx" ON "payload"."_pages_v_blocks_file_area" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_file_area_path_idx" ON "payload"."_pages_v_blocks_file_area" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_posts_order_idx" ON "payload"."_pages_v_blocks_posts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_posts_parent_id_idx" ON "payload"."_pages_v_blocks_posts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_posts_path_idx" ON "payload"."_pages_v_blocks_posts" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_posts_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_tenant_idx" ON "payload"."_pages_v" USING btree ("version_tenant_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "payload"."_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "payload"."_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "payload"."_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "payload"."_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "payload"."_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "payload"."_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "payload"."_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "payload"."_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "payload"."_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_posts_id_idx" ON "payload"."_pages_v_rels" USING btree ("posts_id");
  CREATE INDEX "_pages_v_rels_tags_id_idx" ON "payload"."_pages_v_rels" USING btree ("tags_id");
  CREATE INDEX "_posts_v_parent_idx" ON "payload"."_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_tenant_idx" ON "payload"."_posts_v" USING btree ("version_tenant_id");
  CREATE INDEX "_posts_v_version_version_hero_image_idx" ON "payload"."_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "payload"."_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "payload"."_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "payload"."_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "payload"."_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "payload"."_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "payload"."_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_snapshot_idx" ON "payload"."_posts_v" USING btree ("snapshot");
  CREATE INDEX "_posts_v_published_locale_idx" ON "payload"."_posts_v" USING btree ("published_locale");
  CREATE INDEX "_posts_v_latest_idx" ON "payload"."_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_autosave_idx" ON "payload"."_posts_v" USING btree ("autosave");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "payload"."_posts_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_posts_v_locales_locale_parent_id_unique" ON "payload"."_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_posts_v_rels_order_idx" ON "payload"."_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "payload"."_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "payload"."_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_posts_id_idx" ON "payload"."_posts_v_rels" USING btree ("posts_id");
  CREATE INDEX "_posts_v_rels_categories_id_idx" ON "payload"."_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX "_posts_v_rels_users_id_idx" ON "payload"."_posts_v_rels" USING btree ("users_id");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE INDEX "posts__status_idx" ON "payload"."posts" USING btree ("_status");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."_pages_v_blocks_card_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_card_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_code" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_reusable_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_social_media_social" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_social_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_spacing" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_content_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_content_columns_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_file_area" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_posts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_posts_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_posts_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."_pages_v_blocks_card_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_card_cards_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_card" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_form" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_image" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_media" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_code" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_reusable_content" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_social_media_social" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_social_media" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_spacing" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_content_columns" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_content_columns_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_content" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_file_area" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_posts" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_posts_locales" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."_pages_v_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_rels" CASCADE;
  DROP TABLE "payload"."_posts_v" CASCADE;
  DROP TABLE "payload"."_posts_v_locales" CASCADE;
  DROP TABLE "payload"."_posts_v_rels" CASCADE;
  DROP INDEX "payload"."pages__status_idx";
  DROP INDEX "payload"."posts__status_idx";
  ALTER TABLE "payload"."pages_blocks_card_cards_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_card_cards_locales" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_form" ALTER COLUMN "form_id" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_image" ALTER COLUMN "media_id" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_media" ALTER COLUMN "media_id" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_code" ALTER COLUMN "language" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_code" ALTER COLUMN "code" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_reusable_content" ALTER COLUMN "reusable_content_id" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_social_media_social" ALTER COLUMN "platform" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_spacing" ALTER COLUMN "size" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_posts" ALTER COLUMN "limit" SET NOT NULL;
  ALTER TABLE "payload"."pages_blocks_posts_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "payload"."pages_locales" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "payload"."posts_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "payload"."posts_locales" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "payload"."pages" DROP COLUMN "_status";
  ALTER TABLE "payload"."posts" DROP COLUMN "_status";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_version_status";
  DROP TYPE "payload"."enum__pages_v_published_locale";
  DROP TYPE "payload"."enum_posts_status";
  DROP TYPE "payload"."enum__posts_v_version_status";
  DROP TYPE "payload"."enum__posts_v_published_locale";`);
}
