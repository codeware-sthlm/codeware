import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_file_area" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_file_area" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"name" varchar NOT NULL,
  	"brand_icon" varchar,
  	"brand_color" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "media" ADD COLUMN "external" boolean DEFAULT false;
  ALTER TABLE "pages_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "reusable_content_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  DO $$ BEGIN
   ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_file_area" ADD CONSTRAINT "pages_blocks_file_area_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_file_area" ADD CONSTRAINT "reusable_content_blocks_file_area_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_image" ADD CONSTRAINT "reusable_content_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_image" ADD CONSTRAINT "reusable_content_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "media_rels_tags_id_idx" ON "media_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_file_area_order_idx" ON "pages_blocks_file_area" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_file_area_parent_id_idx" ON "pages_blocks_file_area" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_file_area_path_idx" ON "pages_blocks_file_area" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_file_area_locale_idx" ON "pages_blocks_file_area" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_order_idx" ON "pages_blocks_image" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_parent_id_idx" ON "pages_blocks_image" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_path_idx" ON "pages_blocks_image" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_locale_idx" ON "pages_blocks_image" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_image_media_idx" ON "pages_blocks_image" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_file_area_order_idx" ON "reusable_content_blocks_file_area" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_file_area_parent_id_idx" ON "reusable_content_blocks_file_area" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_file_area_path_idx" ON "reusable_content_blocks_file_area" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_image_order_idx" ON "reusable_content_blocks_image" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_image_parent_id_idx" ON "reusable_content_blocks_image" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_image_path_idx" ON "reusable_content_blocks_image" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_image_media_idx" ON "reusable_content_blocks_image" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "tags_tenant_idx" ON "tags" USING btree ("tenant_id");
  CREATE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_rels" ADD CONSTRAINT "reusable_content_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_rels_tags_id_idx" ON "pages_rels" USING btree ("tags_id","locale");
  CREATE INDEX IF NOT EXISTS "reusable_content_rels_tags_id_idx" ON "reusable_content_rels" USING btree ("tags_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_file_area" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_file_area" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reusable_content_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "pages_blocks_file_area" CASCADE;
  DROP TABLE "pages_blocks_image" CASCADE;
  DROP TABLE "reusable_content_blocks_file_area" CASCADE;
  DROP TABLE "reusable_content_blocks_image" CASCADE;
  DROP TABLE "tags" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_tags_fk";

  ALTER TABLE "reusable_content_rels" DROP CONSTRAINT "reusable_content_rels_tags_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";

  DROP INDEX IF EXISTS "pages_rels_tags_id_idx";
  DROP INDEX IF EXISTS "reusable_content_rels_tags_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "media" DROP COLUMN IF EXISTS "external";
  ALTER TABLE "pages_rels" DROP COLUMN IF EXISTS "tags_id";
  ALTER TABLE "reusable_content_rels" DROP COLUMN IF EXISTS "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tags_id";`);
}
