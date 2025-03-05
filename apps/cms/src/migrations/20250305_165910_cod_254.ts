import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_content_columns_size" AS ENUM('one-third', 'half', 'two-thirds', 'full');
  CREATE TYPE "public"."enum_pages_blocks_code_language" AS ENUM('ts', 'plaintext', 'tsx', 'js', 'jsx');
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "media_locales" (
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_pages_blocks_content_columns_size" DEFAULT 'full',
  	"rich_text" jsonb
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_code" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_pages_blocks_code_language" DEFAULT 'ts' NOT NULL,
  	"code" varchar NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"users_id" integer
  );

  ALTER TABLE "articles" RENAME TO "posts";
  ALTER TABLE "articles_locales" RENAME TO "posts_locales";
  ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "articles_id" TO "posts_id";
  ALTER TABLE "posts" DROP CONSTRAINT "articles_tenant_id_tenants_id_fk";

  ALTER TABLE "posts_locales" DROP CONSTRAINT "articles_locales_parent_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_articles_fk";

  DROP INDEX IF EXISTS "articles_slug_idx";
  DROP INDEX IF EXISTS "articles_tenant_idx";
  DROP INDEX IF EXISTS "articles_updated_at_idx";
  DROP INDEX IF EXISTS "articles_created_at_idx";
  DROP INDEX IF EXISTS "articles_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_articles_id_idx";
  ALTER TABLE "posts_locales" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "pages_locales" ALTER COLUMN "header" SET DEFAULT '';
  ALTER TABLE "pages_locales" ALTER COLUMN "header" DROP NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "posts_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts_locales" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "posts_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "media" ADD COLUMN "tenant_id" integer;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_square_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_small_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_small_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_medium_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_large_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_xlarge_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_og_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_og_filename" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  DO $$ BEGIN
   ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_content_columns" ADD CONSTRAINT "pages_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_media" ADD CONSTRAINT "pages_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_code" ADD CONSTRAINT "pages_blocks_code_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "categories_tenant_idx" ON "categories" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_columns_order_idx" ON "pages_blocks_content_columns" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_columns_parent_id_idx" ON "pages_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_columns_locale_idx" ON "pages_blocks_content_columns" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_order_idx" ON "pages_blocks_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_parent_id_idx" ON "pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_path_idx" ON "pages_blocks_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_content_locale_idx" ON "pages_blocks_content" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_order_idx" ON "pages_blocks_media" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_parent_id_idx" ON "pages_blocks_media" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_path_idx" ON "pages_blocks_media" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_locale_idx" ON "pages_blocks_media" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_media_media_idx" ON "pages_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_code_order_idx" ON "pages_blocks_code" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_code_parent_id_idx" ON "pages_blocks_code" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_code_path_idx" ON "pages_blocks_code" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_code_locale_idx" ON "pages_blocks_code" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_users_id_idx" ON "posts_rels" USING btree ("users_id");
  DO $$ BEGIN
   ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts" ADD CONSTRAINT "posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "posts_hero_image_idx" ON "posts" USING btree ("hero_image_id");
  CREATE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "posts_tenant_idx" ON "posts" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX IF NOT EXISTS "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "media_tenant_idx" ON "media" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX IF NOT EXISTS "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");

  -->> START FIX: Move rich text content from 'pages_locales.content' the new layout content block <<--
  -- Create a temporary table to store the mapping
  CREATE TEMPORARY TABLE content_migration_map (
    page_id INTEGER,
    locale "_locales",
    block_id VARCHAR
  );

  -- Insert content blocks and save the mapping
  WITH inserted_blocks AS (
    INSERT INTO "pages_blocks_content" ("_order", "_parent_id", "_path", "_locale", "id")
    SELECT
      1,
      p.id,
      'layout',
      pl."_locale",
      gen_random_uuid()::varchar
    FROM "pages" p
    JOIN "pages_locales" pl ON p.id = pl."_parent_id"
    WHERE pl."content" IS NOT NULL
    RETURNING "_parent_id", "_locale", "id"
  )
  -- Insert the mapping data into our temporary table
  INSERT INTO content_migration_map (page_id, locale, block_id)
  SELECT "_parent_id", "_locale", "id" FROM inserted_blocks;

  -- Then, insert columns with the rich text content using the mapping table
  INSERT INTO "pages_blocks_content_columns" ("_order", "_parent_id", "_locale", "id", "size", "rich_text")
  SELECT
    1,
    m.block_id,
    m.locale,
    gen_random_uuid()::varchar,
    'full',
    pl."content"
  FROM content_migration_map m
  JOIN "pages_locales" pl ON pl."_parent_id" = m.page_id AND pl."_locale" = m.locale
  WHERE pl."content" IS NOT NULL;

  -- Clean up
  DROP TABLE content_migration_map;
  -->> END FIX <<--

  ALTER TABLE "posts" DROP COLUMN IF EXISTS "author";
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "content";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"slug" varchar,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "articles_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_code" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "pages_blocks_content_columns" CASCADE;
  DROP TABLE "pages_blocks_content" CASCADE;
  DROP TABLE "pages_blocks_media" CASCADE;
  DROP TABLE "pages_blocks_code" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_tenant_id_tenants_id_fk";

  ALTER TABLE "pages_locales" DROP CONSTRAINT "pages_locales_meta_image_id_media_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_posts_fk";

  DROP INDEX IF EXISTS "media_tenant_idx";
  DROP INDEX IF EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_square_sizes_square_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_small_sizes_small_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_medium_sizes_medium_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_large_sizes_large_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_xlarge_sizes_xlarge_filename_idx";
  DROP INDEX IF EXISTS "media_sizes_og_sizes_og_filename_idx";
  DROP INDEX IF EXISTS "pages_meta_meta_image_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_posts_id_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "pages_locales" ALTER COLUMN "header" DROP DEFAULT;
  ALTER TABLE "pages_locales" ALTER COLUMN "header" SET NOT NULL;
  ALTER TABLE "pages_locales" ADD COLUMN "content" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "articles_id" integer;
  DO $$ BEGIN
   ALTER TABLE "articles" ADD CONSTRAINT "articles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "articles_tenant_idx" ON "articles" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "articles_locales_locale_parent_id_unique" ON "articles_locales" USING btree ("_locale","_parent_id");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  ALTER TABLE "media" DROP COLUMN IF EXISTS "tenant_id";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_square_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_small_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_medium_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_large_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_xlarge_filename";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_url";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_width";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_height";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_mime_type";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filesize";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "sizes_og_filename";
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "meta_title";
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "meta_image_id";
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "meta_description";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "posts_id";
  DROP TYPE "public"."enum_pages_blocks_content_columns_size";
  DROP TYPE "public"."enum_pages_blocks_code_language";`);
}
