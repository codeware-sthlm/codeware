import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cards_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_cards_link_nav_trigger" AS ENUM('card', 'link');
  CREATE TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_nav_trigger" AS ENUM('card', 'link');
  CREATE TABLE IF NOT EXISTS "cards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"icon" varchar,
  	"enable_link" boolean,
  	"link_type" "enum_cards_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_nav_trigger" "enum_cards_link_nav_trigger" DEFAULT 'card',
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "cards_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"content" varchar NOT NULL,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "cards_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_card_custom_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"card_icon" varchar,
  	"card_title" varchar NOT NULL,
  	"card_description" varchar,
  	"card_content" varchar NOT NULL,
  	"card_enable_link" boolean,
  	"card_link_type" "enum_pages_blocks_card_custom_cards_card_link_type" DEFAULT 'reference',
  	"card_link_new_tab" boolean,
  	"card_link_url" varchar,
  	"card_link_nav_trigger" "enum_pages_blocks_card_custom_cards_card_link_nav_trigger" DEFAULT 'card',
  	"card_link_label" varchar
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "_locales",
  	"cards_id" integer,
  	"pages_id" integer,
  	"posts_id" integer
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cards_id" integer;
  DO $$ BEGIN
   ALTER TABLE "cards" ADD CONSTRAINT "cards_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "cards_locales" ADD CONSTRAINT "cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "cards_rels" ADD CONSTRAINT "cards_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "cards_rels" ADD CONSTRAINT "cards_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "cards_rels" ADD CONSTRAINT "cards_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_card_custom_cards" ADD CONSTRAINT "pages_blocks_card_custom_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_card" ADD CONSTRAINT "pages_blocks_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "cards_tenant_idx" ON "cards" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "cards_slug_idx" ON "cards" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "cards_updated_at_idx" ON "cards" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "cards_created_at_idx" ON "cards" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "cards_locales_locale_parent_id_unique" ON "cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "cards_rels_order_idx" ON "cards_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "cards_rels_parent_idx" ON "cards_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "cards_rels_path_idx" ON "cards_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "cards_rels_pages_id_idx" ON "cards_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "cards_rels_posts_id_idx" ON "cards_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_order_idx" ON "pages_blocks_card_custom_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_parent_id_idx" ON "pages_blocks_card_custom_cards" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_locale_idx" ON "pages_blocks_card_custom_cards" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_order_idx" ON "pages_blocks_card" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_parent_id_idx" ON "pages_blocks_card" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_path_idx" ON "pages_blocks_card" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_locale_idx" ON "pages_blocks_card" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "pages_rels_locale_idx" ON "pages_rels" USING btree ("locale");
  CREATE INDEX IF NOT EXISTS "pages_rels_cards_id_idx" ON "pages_rels" USING btree ("cards_id","locale");
  CREATE INDEX IF NOT EXISTS "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id","locale");
  CREATE INDEX IF NOT EXISTS "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id","locale");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("cards_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cards_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_card_custom_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_card" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cards" CASCADE;
  DROP TABLE "cards_locales" CASCADE;
  DROP TABLE "cards_rels" CASCADE;
  DROP TABLE "pages_blocks_card_custom_cards" CASCADE;
  DROP TABLE "pages_blocks_card" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cards_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_cards_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "cards_id";
  DROP TYPE "public"."enum_cards_link_type";
  DROP TYPE "public"."enum_cards_link_nav_trigger";
  DROP TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_type";
  DROP TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_nav_trigger";`);
}
