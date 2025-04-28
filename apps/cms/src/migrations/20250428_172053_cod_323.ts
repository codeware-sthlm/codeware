import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_spacing_size" AS ENUM('tight', 'regular', 'loose');
  CREATE TABLE IF NOT EXISTS "pages_blocks_spacing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_spacing_size" DEFAULT 'regular' NOT NULL,
  	"divider" boolean,
  	"color" varchar,
  	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "reusable_content_blocks_spacing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_spacing_size" DEFAULT 'regular' NOT NULL,
  	"divider" boolean,
  	"color" varchar,
  	"block_name" varchar
  );

  DO $$ BEGIN
   ALTER TABLE "pages_blocks_spacing" ADD CONSTRAINT "pages_blocks_spacing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_spacing" ADD CONSTRAINT "reusable_content_blocks_spacing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "pages_blocks_spacing_order_idx" ON "pages_blocks_spacing" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_spacing_parent_id_idx" ON "pages_blocks_spacing" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_spacing_path_idx" ON "pages_blocks_spacing" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_spacing_locale_idx" ON "pages_blocks_spacing" USING btree ("_locale");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_spacing_order_idx" ON "reusable_content_blocks_spacing" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_spacing_parent_id_idx" ON "reusable_content_blocks_spacing" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_spacing_path_idx" ON "reusable_content_blocks_spacing" USING btree ("_path");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_spacing" CASCADE;
  DROP TABLE "reusable_content_blocks_spacing" CASCADE;
  DROP TYPE "public"."enum_spacing_size";`);
}
