import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_feature_cards_columns" AS ENUM('auto', '2', '3', '4');
  CREATE TYPE "payload"."enum_hero_action_emphasis" AS ENUM('primary', 'secondary');
  CREATE TYPE "payload"."enum_pill_list_surface" AS ENUM('dark', 'light');
  CREATE TABLE "payload"."pages_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"show_mark" boolean DEFAULT true,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_callout_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_feature_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"brand_icon" varchar,
  	"brand_color" varchar
  );

  CREATE TABLE "payload"."pages_blocks_feature_cards_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_feature_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "payload"."enum_feature_cards_columns" DEFAULT 'auto',
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_feature_cards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"emphasis" "payload"."enum_hero_action_emphasis" DEFAULT 'primary'
  );

  CREATE TABLE "payload"."pages_blocks_hero_actions_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_hero_locales" (
  	"badge" varchar,
  	"heading" varchar,
  	"lede" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_pill_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );

  CREATE TABLE "payload"."pages_blocks_pill_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"surface" "payload"."enum_pill_list_surface" DEFAULT 'dark',
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_pill_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_showcase_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"meta" varchar,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar
  );

  CREATE TABLE "payload"."pages_blocks_showcase_items_locales" (
  	"tag" varchar,
  	"title" varchar,
  	"description" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."pages_blocks_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enable_header_link" boolean,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."pages_blocks_showcase_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"show_mark" boolean DEFAULT true,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_callout_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_feature_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_icon" varchar,
  	"brand_color" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_feature_cards_items_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_feature_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" "payload"."enum_feature_cards_columns" DEFAULT 'auto',
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_feature_cards_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_hero_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"emphasis" "payload"."enum_hero_action_emphasis" DEFAULT 'primary',
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_hero_actions_locales" (
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_hero_locales" (
  	"badge" varchar,
  	"heading" varchar,
  	"lede" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_pill_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_pill_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"surface" "payload"."enum_pill_list_surface" DEFAULT 'dark',
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_pill_list_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_showcase_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta" varchar,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"_uuid" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_showcase_items_locales" (
  	"tag" varchar,
  	"title" varchar,
  	"description" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  CREATE TABLE "payload"."_pages_v_blocks_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"enable_header_link" boolean,
  	"link_type" "payload"."enum_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "payload"."_pages_v_blocks_showcase_locales" (
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"link_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "payload"."pages_blocks_callout" ADD CONSTRAINT "pages_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_callout_locales" ADD CONSTRAINT "pages_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_cards_items" ADD CONSTRAINT "pages_blocks_feature_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_cards_items_locales" ADD CONSTRAINT "pages_blocks_feature_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_feature_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_cards" ADD CONSTRAINT "pages_blocks_feature_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_feature_cards_locales" ADD CONSTRAINT "pages_blocks_feature_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero_actions" ADD CONSTRAINT "pages_blocks_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero_actions_locales" ADD CONSTRAINT "pages_blocks_hero_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_hero_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_hero_locales" ADD CONSTRAINT "pages_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_pill_list_items" ADD CONSTRAINT "pages_blocks_pill_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_pill_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_pill_list" ADD CONSTRAINT "pages_blocks_pill_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_pill_list_locales" ADD CONSTRAINT "pages_blocks_pill_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_pill_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_showcase_items" ADD CONSTRAINT "pages_blocks_showcase_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_showcase_items_locales" ADD CONSTRAINT "pages_blocks_showcase_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_showcase_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_showcase" ADD CONSTRAINT "pages_blocks_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_showcase_locales" ADD CONSTRAINT "pages_blocks_showcase_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_callout" ADD CONSTRAINT "_pages_v_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_callout_locales" ADD CONSTRAINT "_pages_v_blocks_callout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_callout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_cards_items" ADD CONSTRAINT "_pages_v_blocks_feature_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_cards_items_locales" ADD CONSTRAINT "_pages_v_blocks_feature_cards_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_feature_cards_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_cards" ADD CONSTRAINT "_pages_v_blocks_feature_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_feature_cards_locales" ADD CONSTRAINT "_pages_v_blocks_feature_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_feature_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_actions" ADD CONSTRAINT "_pages_v_blocks_hero_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_actions_locales" ADD CONSTRAINT "_pages_v_blocks_hero_actions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_hero_actions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero" ADD CONSTRAINT "_pages_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_hero_locales" ADD CONSTRAINT "_pages_v_blocks_hero_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_pill_list_items" ADD CONSTRAINT "_pages_v_blocks_pill_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_pill_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_pill_list" ADD CONSTRAINT "_pages_v_blocks_pill_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_pill_list_locales" ADD CONSTRAINT "_pages_v_blocks_pill_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_pill_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_showcase_items" ADD CONSTRAINT "_pages_v_blocks_showcase_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_showcase_items_locales" ADD CONSTRAINT "_pages_v_blocks_showcase_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_showcase_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_showcase" ADD CONSTRAINT "_pages_v_blocks_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_showcase_locales" ADD CONSTRAINT "_pages_v_blocks_showcase_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_showcase"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_callout_order_idx" ON "payload"."pages_blocks_callout" USING btree ("_order");
  CREATE INDEX "pages_blocks_callout_parent_id_idx" ON "payload"."pages_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_path_idx" ON "payload"."pages_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_callout_locales_locale_parent_id_unique" ON "payload"."pages_blocks_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_items_order_idx" ON "payload"."pages_blocks_feature_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_items_parent_id_idx" ON "payload"."pages_blocks_feature_cards_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_feature_cards_items_locales_locale_parent_id_un" ON "payload"."pages_blocks_feature_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_order_idx" ON "payload"."pages_blocks_feature_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_feature_cards_parent_id_idx" ON "payload"."pages_blocks_feature_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_feature_cards_path_idx" ON "payload"."pages_blocks_feature_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_feature_cards_locales_locale_parent_id_unique" ON "payload"."pages_blocks_feature_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_actions_order_idx" ON "payload"."pages_blocks_hero_actions" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_actions_parent_id_idx" ON "payload"."pages_blocks_hero_actions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_hero_actions_locales_locale_parent_id_unique" ON "payload"."pages_blocks_hero_actions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "payload"."pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "payload"."pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "payload"."pages_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_hero_locales_locale_parent_id_unique" ON "payload"."pages_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_pill_list_items_order_idx" ON "payload"."pages_blocks_pill_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_pill_list_items_parent_id_idx" ON "payload"."pages_blocks_pill_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pill_list_order_idx" ON "payload"."pages_blocks_pill_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_pill_list_parent_id_idx" ON "payload"."pages_blocks_pill_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_pill_list_path_idx" ON "payload"."pages_blocks_pill_list" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_pill_list_locales_locale_parent_id_unique" ON "payload"."pages_blocks_pill_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_showcase_items_order_idx" ON "payload"."pages_blocks_showcase_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_showcase_items_parent_id_idx" ON "payload"."pages_blocks_showcase_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_blocks_showcase_items_locales_locale_parent_id_unique" ON "payload"."pages_blocks_showcase_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_blocks_showcase_order_idx" ON "payload"."pages_blocks_showcase" USING btree ("_order");
  CREATE INDEX "pages_blocks_showcase_parent_id_idx" ON "payload"."pages_blocks_showcase" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_showcase_path_idx" ON "payload"."pages_blocks_showcase" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_showcase_locales_locale_parent_id_unique" ON "payload"."pages_blocks_showcase_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_order_idx" ON "payload"."_pages_v_blocks_callout" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_callout_parent_id_idx" ON "payload"."_pages_v_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_path_idx" ON "payload"."_pages_v_blocks_callout" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_callout_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_callout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_items_order_idx" ON "payload"."_pages_v_blocks_feature_cards_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_cards_items_parent_id_idx" ON "payload"."_pages_v_blocks_feature_cards_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_feature_cards_items_locales_locale_parent_id" ON "payload"."_pages_v_blocks_feature_cards_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_order_idx" ON "payload"."_pages_v_blocks_feature_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_feature_cards_parent_id_idx" ON "payload"."_pages_v_blocks_feature_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_feature_cards_path_idx" ON "payload"."_pages_v_blocks_feature_cards" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_feature_cards_locales_locale_parent_id_uniqu" ON "payload"."_pages_v_blocks_feature_cards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_actions_order_idx" ON "payload"."_pages_v_blocks_hero_actions" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_actions_parent_id_idx" ON "payload"."_pages_v_blocks_hero_actions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_actions_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_hero_actions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_order_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_parent_id_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_hero_path_idx" ON "payload"."_pages_v_blocks_hero" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_hero_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_hero_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_pill_list_items_order_idx" ON "payload"."_pages_v_blocks_pill_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pill_list_items_parent_id_idx" ON "payload"."_pages_v_blocks_pill_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pill_list_order_idx" ON "payload"."_pages_v_blocks_pill_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_pill_list_parent_id_idx" ON "payload"."_pages_v_blocks_pill_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_pill_list_path_idx" ON "payload"."_pages_v_blocks_pill_list" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_pill_list_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_pill_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_showcase_items_order_idx" ON "payload"."_pages_v_blocks_showcase_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_showcase_items_parent_id_idx" ON "payload"."_pages_v_blocks_showcase_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_pages_v_blocks_showcase_items_locales_locale_parent_id_uniq" ON "payload"."_pages_v_blocks_showcase_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_showcase_order_idx" ON "payload"."_pages_v_blocks_showcase" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_showcase_parent_id_idx" ON "payload"."_pages_v_blocks_showcase" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_showcase_path_idx" ON "payload"."_pages_v_blocks_showcase" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_showcase_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_showcase_locales" USING btree ("_locale","_parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."pages_blocks_callout" CASCADE;
  DROP TABLE "payload"."pages_blocks_callout_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_cards_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_cards_items_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_cards" CASCADE;
  DROP TABLE "payload"."pages_blocks_feature_cards_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero_actions" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero_actions_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero" CASCADE;
  DROP TABLE "payload"."pages_blocks_hero_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_pill_list_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_pill_list" CASCADE;
  DROP TABLE "payload"."pages_blocks_pill_list_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_showcase_items" CASCADE;
  DROP TABLE "payload"."pages_blocks_showcase_items_locales" CASCADE;
  DROP TABLE "payload"."pages_blocks_showcase" CASCADE;
  DROP TABLE "payload"."pages_blocks_showcase_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_callout" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_callout_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_cards_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_cards_items_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_cards" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_feature_cards_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero_actions" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero_actions_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_hero_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_pill_list_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_pill_list" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_pill_list_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_showcase_items" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_showcase_items_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_showcase" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_showcase_locales" CASCADE;
  DROP TYPE "payload"."enum_feature_cards_columns";
  DROP TYPE "payload"."enum_hero_action_emphasis";
  DROP TYPE "payload"."enum_pill_list_surface";`);
}
