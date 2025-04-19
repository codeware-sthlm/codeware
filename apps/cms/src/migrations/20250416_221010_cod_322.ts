import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cards_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cards" CASCADE;
  DROP TABLE "cards_locales" CASCADE;
  DROP TABLE "cards_rels" CASCADE;
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME TO "pages_blocks_card_cards";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME TO "reusable_content_blocks_card_cards";
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" RENAME TO "reusable_content_blocks_card_cards_locales";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_brand_icon" TO "brand_icon";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_brand_color" TO "brand_color";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_title" TO "title";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_description" TO "description";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_content" TO "content";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_enable_link" TO "enable_link";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_link_type" TO "link_type";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_link_new_tab" TO "link_new_tab";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_link_url" TO "link_url";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_link_nav_trigger" TO "link_nav_trigger";
  ALTER TABLE "pages_blocks_card_cards" RENAME COLUMN "card_link_label" TO "link_label";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_brand_icon" TO "brand_icon";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_brand_color" TO "brand_color";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_enable_link" TO "enable_link";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_link_type" TO "link_type";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_link_new_tab" TO "link_new_tab";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_link_url" TO "link_url";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME COLUMN "card_link_nav_trigger" TO "link_nav_trigger";
  ALTER TABLE "reusable_content_blocks_card_cards_locales" RENAME COLUMN "card_title" TO "title";
  ALTER TABLE "reusable_content_blocks_card_cards_locales" RENAME COLUMN "card_description" TO "description";
  ALTER TABLE "reusable_content_blocks_card_cards_locales" RENAME COLUMN "card_content" TO "content";
  ALTER TABLE "reusable_content_blocks_card_cards_locales" RENAME COLUMN "card_link_label" TO "link_label";
  ALTER TABLE "pages_blocks_card_cards" DROP CONSTRAINT "pages_blocks_card_custom_cards_parent_id_fk";

  ALTER TABLE "reusable_content_blocks_card_cards" DROP CONSTRAINT "reusable_content_blocks_card_custom_cards_parent_id_fk";

  ALTER TABLE "reusable_content_blocks_card_cards_locales" DROP CONSTRAINT "reusable_content_blocks_card_custom_cards_locales_parent_id_fk";

  DROP INDEX IF EXISTS "pages_blocks_card_custom_cards_order_idx";
  DROP INDEX IF EXISTS "pages_blocks_card_custom_cards_parent_id_idx";
  DROP INDEX IF EXISTS "pages_blocks_card_custom_cards_locale_idx";
  DROP INDEX IF EXISTS "pages_rels_cards_id_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_custom_cards_order_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_custom_cards_parent_id_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_custom_cards_locales_locale_parent_id_unique";
  DROP INDEX IF EXISTS "reusable_content_rels_cards_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_cards_id_idx";
  DO $$ BEGIN
   ALTER TABLE "pages_blocks_card_cards" ADD CONSTRAINT "pages_blocks_card_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_card_cards" ADD CONSTRAINT "reusable_content_blocks_card_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_card_cards_locales" ADD CONSTRAINT "reusable_content_blocks_card_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_card_cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_card_cards_order_idx" ON "pages_blocks_card_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_cards_parent_id_idx" ON "pages_blocks_card_cards" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_cards_locale_idx" ON "pages_blocks_card_cards" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_cards_order_idx" ON "reusable_content_blocks_card_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_cards_parent_id_idx" ON "reusable_content_blocks_card_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "reusable_content_blocks_card_cards_locales_locale_parent_id_unique" ON "reusable_content_blocks_card_cards_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "cards_id";
  ALTER TABLE "reusable_content_rels" DROP COLUMN IF EXISTS "cards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "cards_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "cards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"brand_icon" varchar,
  	"brand_color" varchar,
  	"enable_link" boolean,
  	"link_type" "enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_nav_trigger" "enum_nav_trigger" DEFAULT 'card',
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

  ALTER TABLE "pages_blocks_card_cards" RENAME TO "pages_blocks_card_custom_cards";
  ALTER TABLE "reusable_content_blocks_card_cards" RENAME TO "reusable_content_blocks_card_custom_cards";
  ALTER TABLE "reusable_content_blocks_card_cards_locales" RENAME TO "reusable_content_blocks_card_custom_cards_locales";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "brand_icon" TO "card_brand_icon";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "brand_color" TO "card_brand_color";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "title" TO "card_title";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "description" TO "card_description";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "content" TO "card_content";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "enable_link" TO "card_enable_link";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "link_type" TO "card_link_type";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "link_new_tab" TO "card_link_new_tab";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "link_url" TO "card_link_url";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "link_nav_trigger" TO "card_link_nav_trigger";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "link_label" TO "card_link_label";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "brand_icon" TO "card_brand_icon";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "brand_color" TO "card_brand_color";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "enable_link" TO "card_enable_link";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "link_type" TO "card_link_type";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "link_new_tab" TO "card_link_new_tab";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "link_url" TO "card_link_url";
  ALTER TABLE "reusable_content_blocks_card_custom_cards" RENAME COLUMN "link_nav_trigger" TO "card_link_nav_trigger";
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" RENAME COLUMN "title" TO "card_title";
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" RENAME COLUMN "description" TO "card_description";
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" RENAME COLUMN "content" TO "card_content";
  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" RENAME COLUMN "link_label" TO "card_link_label";
  ALTER TABLE "pages_blocks_card_custom_cards" DROP CONSTRAINT "pages_blocks_card_cards_parent_id_fk";

  ALTER TABLE "reusable_content_blocks_card_custom_cards" DROP CONSTRAINT "reusable_content_blocks_card_cards_parent_id_fk";

  ALTER TABLE "reusable_content_blocks_card_custom_cards_locales" DROP CONSTRAINT "reusable_content_blocks_card_cards_locales_parent_id_fk";

  DROP INDEX IF EXISTS "pages_blocks_card_cards_order_idx";
  DROP INDEX IF EXISTS "pages_blocks_card_cards_parent_id_idx";
  DROP INDEX IF EXISTS "pages_blocks_card_cards_locale_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_cards_order_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_cards_parent_id_idx";
  DROP INDEX IF EXISTS "reusable_content_blocks_card_cards_locales_locale_parent_id_unique";
  ALTER TABLE "pages_rels" ADD COLUMN "cards_id" integer;
  ALTER TABLE "reusable_content_rels" ADD COLUMN "cards_id" integer;
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
  DO $$ BEGIN
   ALTER TABLE "pages_blocks_card_custom_cards" ADD CONSTRAINT "pages_blocks_card_custom_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_card"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
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
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_order_idx" ON "pages_blocks_card_custom_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_parent_id_idx" ON "pages_blocks_card_custom_cards" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_card_custom_cards_locale_idx" ON "pages_blocks_card_custom_cards" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_rels_cards_id_idx" ON "pages_rels" USING btree ("cards_id","locale");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_order_idx" ON "reusable_content_blocks_card_custom_cards" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_parent_id_idx" ON "reusable_content_blocks_card_custom_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "reusable_content_blocks_card_custom_cards_locales_locale_parent_id_unique" ON "reusable_content_blocks_card_custom_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_cards_id_idx" ON "reusable_content_rels" USING btree ("cards_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("cards_id");`);
}
