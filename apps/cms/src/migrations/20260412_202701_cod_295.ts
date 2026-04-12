import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."pages_blocks_posts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 10 NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_posts_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  ALTER TABLE "payload"."pages_blocks_posts" ADD CONSTRAINT "pages_blocks_posts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_posts_locales" ADD CONSTRAINT "pages_blocks_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_posts_order_idx" ON "payload"."pages_blocks_posts" USING btree ("_order");
  CREATE INDEX "pages_blocks_posts_parent_id_idx" ON "payload"."pages_blocks_posts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_posts_path_idx" ON "payload"."pages_blocks_posts" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_posts_locales_locale_parent_id_unique" ON "payload"."pages_blocks_posts_locales" USING btree ("_locale","_parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."pages_blocks_posts" CASCADE;
  DROP TABLE "payload"."pages_blocks_posts_locales" CASCADE;`);
}
