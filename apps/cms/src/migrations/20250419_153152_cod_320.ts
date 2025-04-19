import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_media_platform" AS ENUM('discord', 'facebook', 'github', 'instagram', 'linkedin', 'npm', 'web', 'x', 'youtube');
  CREATE TABLE IF NOT EXISTS "pages_blocks_social_media_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_social_media_platform" NOT NULL,
  	"url" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "pages_blocks_social_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_social_media_social" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_social_media_platform" NOT NULL,
  	"url" varchar NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_social_media" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_social_media_social" ADD CONSTRAINT "pages_blocks_social_media_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_social_media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_social_media" ADD CONSTRAINT "pages_blocks_social_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_social_media_social" ADD CONSTRAINT "reusable_content_blocks_social_media_social_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content_blocks_social_media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_social_media" ADD CONSTRAINT "reusable_content_blocks_social_media_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_social_order_idx" ON "pages_blocks_social_media_social" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_social_parent_id_idx" ON "pages_blocks_social_media_social" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_social_locale_idx" ON "pages_blocks_social_media_social" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_order_idx" ON "pages_blocks_social_media" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_parent_id_idx" ON "pages_blocks_social_media" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_path_idx" ON "pages_blocks_social_media" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_social_media_locale_idx" ON "pages_blocks_social_media" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_social_media_social_order_idx" ON "reusable_content_blocks_social_media_social" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_social_media_social_parent_id_idx" ON "reusable_content_blocks_social_media_social" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_social_media_order_idx" ON "reusable_content_blocks_social_media" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_social_media_parent_id_idx" ON "reusable_content_blocks_social_media" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_social_media_path_idx" ON "reusable_content_blocks_social_media" USING btree ("_path");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_social_media_social" CASCADE;
  DROP TABLE "pages_blocks_social_media" CASCADE;
  DROP TABLE "reusable_content_blocks_social_media_social" CASCADE;
  DROP TABLE "reusable_content_blocks_social_media" CASCADE;
  DROP TYPE "public"."enum_social_media_platform";`);
}
