import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "reusable_content_blocks_reusable_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"reusable_content_id" integer NOT NULL,
  	"ref_id" varchar,
  	"block_name" varchar
  );

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_reusable_content" ADD CONSTRAINT "reusable_content_blocks_reusable_content_reusable_content_id_reusable_content_id_fk" FOREIGN KEY ("reusable_content_id") REFERENCES "public"."reusable_content"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
   ALTER TABLE "reusable_content_blocks_reusable_content" ADD CONSTRAINT "reusable_content_blocks_reusable_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reusable_content"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_reusable_content_order_idx" ON "reusable_content_blocks_reusable_content" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_reusable_content_parent_id_idx" ON "reusable_content_blocks_reusable_content" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_reusable_content_path_idx" ON "reusable_content_blocks_reusable_content" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "reusable_content_blocks_reusable_content_reusable_content_idx" ON "reusable_content_blocks_reusable_content" USING btree ("reusable_content_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "reusable_content_blocks_reusable_content" CASCADE;`);
}
