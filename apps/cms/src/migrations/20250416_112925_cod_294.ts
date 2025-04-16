import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "pages_blocks_reusable_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reusable_content_id" integer NOT NULL,
  	"ref_id" varchar,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_card_custom_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"card_brand_icon" varchar,
  	"card_brand_color" varchar,
  	"card_enable_link" boolean,
  	"card_link_type" "enum_link_type" DEFAULT 'reference',
  	"card_link_new_tab" boolean,
  	"card_link_url" varchar,
  	"card_link_nav_trigger" "enum_nav_trigger" DEFAULT 'card'
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_card_custom_cards_locales" (
  	"card_title" varchar NOT NULL,
  	"card_description" varchar,
  	"card_content" varchar NOT NULL,
  	"card_link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_code" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_code_language" DEFAULT 'ts' NOT NULL,
  	"code" varchar NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_content_column_size" DEFAULT 'full',
  	"rich_text" jsonb
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"enable_intro" boolean,
  	"intro_content" jsonb,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"cards_id" integer,
  	"pages_id" integer,
  	"posts_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reusable_content_id" integer;
  DO $$ BEGIN
   ALTER TABLE "pages_blocks_reusable_content" ADD CONSTRAINT "pages_blocks_reusable_content_reusable_content_id_reusable_content_id_fk" FOREIGN KEY ("reusable_content_id") REFERENCES "public"."reusable_content"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_reusable_content" ADD CONSTRAINT "pages_blocks_reusable_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_card_custom_cards" ADD CONSTRAINT "reusable_content_blocks_card_custom_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" ADD CONSTRAINT "reusable_content_blocks_card_custom_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_card_custom_cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_card" ADD CONSTRAINT "reusable_content_blocks_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_code" ADD CONSTRAINT "reusable_content_blocks_code_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_content_columns" ADD CONSTRAINT "reusable_content_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_content" ADD CONSTRAINT "reusable_content_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_form" ADD CONSTRAINT "reusable_content_blocks_form_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_form" ADD CONSTRAINT "reusable_content_blocks_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_media" ADD CONSTRAINT "reusable_content_blocks_media_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_media" ADD CONSTRAINT "reusable_content_blocks_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content" ADD CONSTRAINT "reusable_content_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_locales" ADD CONSTRAINT "reusable_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_reusable_content_order_idx" ON "pages_blocks_reusable_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_reusable_content_parent_id_idx" ON "pages_blocks_reusable_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_reusable_content_path_idx" ON "pages_blocks_reusable_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_reusable_content_locale_idx" ON "pages_blocks_reusable_content" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_reusable_content_reusable_content_idx" ON "pages_blocks_reusable_content" USING btree ("reusable_content_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_order_idx" ON "reusable_content_blocks_card_custom_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_parent_id_idx" ON "reusable_content_blocks_card_custom_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_locales_locale_parent_id_unique" ON "reusable_content_blocks_card_custom_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_order_idx" ON "reusable_content_blocks_card" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_parent_id_idx" ON "reusable_content_blocks_card" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_path_idx" ON "reusable_content_blocks_card" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_code_order_idx" ON "reusable_content_blocks_code" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_code_parent_id_idx" ON "reusable_content_blocks_code" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_code_path_idx" ON "reusable_content_blocks_code" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_content_columns_order_idx" ON "reusable_content_blocks_content_columns" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_content_columns_parent_id_idx" ON "reusable_content_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_content_order_idx" ON "reusable_content_blocks_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_content_parent_id_idx" ON "reusable_content_blocks_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_content_path_idx" ON "reusable_content_blocks_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_form_order_idx" ON "reusable_content_blocks_form" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_form_parent_id_idx" ON "reusable_content_blocks_form" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_form_path_idx" ON "reusable_content_blocks_form" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_form_form_idx" ON "reusable_content_blocks_form" USING btree ("form_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_media_order_idx" ON "reusable_content_blocks_media" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_media_parent_id_idx" ON "reusable_content_blocks_media" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_media_path_idx" ON "reusable_content_blocks_media" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_media_media_idx" ON "reusable_content_blocks_media" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_tenant_idx" ON "reusable_content" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_updated_at_idx" ON "reusable_content" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reusable_content_created_at_idx" ON "reusable_content" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "reusable_content_locales_locale_parent_id_unique" ON "reusable_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_order_idx" ON "reusable_content_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_parent_idx" ON "reusable_content_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_path_idx" ON "reusable_content_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_cards_id_idx" ON "reusable_content_rels" USING btree ("cards_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_pages_id_idx" ON "reusable_content_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_posts_id_idx" ON "reusable_content_rels" USING btree ("posts_id");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reusable_content_fk" FOREIGN KEY ("reusable_content_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reusable_content_id_idx" ON "payload_locked_documents_rels" USING btree ("reusable_content_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_reusable_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_card_custom_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_code" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_content_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_form" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_reusable_content" CASCADE;
  DROP TABLE "reusable_content_blocks_card_custom_cards" CASCADE;
  DROP TABLE "reusable_content_blocks_card_custom_cards_locales" CASCADE;
  DROP TABLE "reusable_content_blocks_card" CASCADE;
  DROP TABLE "reusable_content_blocks_code" CASCADE;
  DROP TABLE "reusable_content_blocks_content_columns" CASCADE;
  DROP TABLE "reusable_content_blocks_content" CASCADE;
  DROP TABLE "reusable_content_blocks_form" CASCADE;
  DROP TABLE "reusable_content_blocks_media" CASCADE;
  DROP TABLE "reusable_content" CASCADE;
  DROP TABLE "reusable_content_locales" CASCADE;
  DROP TABLE "reusable_content_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reusable_content_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_reusable_content_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reusable_content_id";`);
}
