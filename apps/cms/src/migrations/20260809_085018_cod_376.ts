import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_platform_labels_type" AS ENUM('place-kind', 'stock-subject');
  CREATE TYPE "payload"."enum_tours_intent" AS ENUM('booking', 'interest');
  CREATE TYPE "payload"."enum_tours_currency" AS ENUM('EUR', 'SEK', 'USD', 'GBP');
  CREATE TYPE "payload"."enum_tours_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__tours_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__tours_v_published_locale" AS ENUM('en', 'sv');
  CREATE TABLE "payload"."pages_blocks_tours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 10,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."pages_blocks_tours_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_tours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"limit" numeric DEFAULT 10,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_pages_v_blocks_tours_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."places" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"name" varchar NOT NULL,
  	"kind_id" integer NOT NULL,
  	"url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."places_locales" (
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."platform_labels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "payload"."enum_platform_labels_type" NOT NULL,
  	"name" varchar NOT NULL,
  	"icon" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."stock_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"subject_id" integer,
  	"credit" varchar,
  	"licence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_small_url" varchar,
  	"sizes_small_width" numeric,
  	"sizes_small_height" numeric,
  	"sizes_small_mime_type" varchar,
  	"sizes_small_filesize" numeric,
  	"sizes_small_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_meta_url" varchar,
  	"sizes_meta_width" numeric,
  	"sizes_meta_height" numeric,
  	"sizes_meta_mime_type" varchar,
  	"sizes_meta_filesize" numeric,
  	"sizes_meta_filename" varchar
  );
  
  CREATE TABLE "payload"."tours_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."tours_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."tours_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."tours_not_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."tours_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."tours_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."tours" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"intent" "payload"."enum_tours_intent" DEFAULT 'booking',
  	"departure_date" timestamp(3) with time zone,
  	"booking_deadline" timestamp(3) with time zone,
  	"price" numeric,
  	"currency" "payload"."enum_tours_currency" DEFAULT 'EUR',
  	"booking_form_id" integer,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_tours_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."tours_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"destination" varchar,
  	"duration" varchar,
  	"departure_note" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."tours_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stock_media_id" integer,
  	"media_id" integer,
  	"places_id" integer
  );
  
  CREATE TABLE "payload"."_tours_v_version_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_tours_v_version_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_tours_v_version_not_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_tours_v_version_not_included_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_tours_v_version_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_tours_v_version_itinerary_locales" (
  	"title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_tours_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_tenant_id" integer,
  	"version_intent" "payload"."enum_tours_intent" DEFAULT 'booking',
  	"version_departure_date" timestamp(3) with time zone,
  	"version_booking_deadline" timestamp(3) with time zone,
  	"version_price" numeric,
  	"version_currency" "payload"."enum_tours_currency" DEFAULT 'EUR',
  	"version_booking_form_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__tours_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__tours_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_tours_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_destination" varchar,
  	"version_duration" varchar,
  	"version_departure_note" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_tours_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stock_media_id" integer,
  	"media_id" integer,
  	"places_id" integer
  );
  
  ALTER TABLE "payload"."site_settings_footer_contact" ALTER COLUMN "platform" SET NOT NULL;
  ALTER TABLE "payload"."forms_blocks_number" ADD COLUMN "min" numeric;
  ALTER TABLE "payload"."forms_blocks_number" ADD COLUMN "max" numeric;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "places_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "platform_labels_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "stock_media_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "tours_id" integer;
  ALTER TABLE "payload"."pages_blocks_tours" ADD CONSTRAINT "pages_blocks_tours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_blocks_tours_locales" ADD CONSTRAINT "pages_blocks_tours_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages_blocks_tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_tours" ADD CONSTRAINT "_pages_v_blocks_tours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_blocks_tours_locales" ADD CONSTRAINT "_pages_v_blocks_tours_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v_blocks_tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."places" ADD CONSTRAINT "places_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."places" ADD CONSTRAINT "places_kind_id_platform_labels_id_fk" FOREIGN KEY ("kind_id") REFERENCES "payload"."platform_labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."places_locales" ADD CONSTRAINT "places_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stock_media" ADD CONSTRAINT "stock_media_subject_id_platform_labels_id_fk" FOREIGN KEY ("subject_id") REFERENCES "payload"."platform_labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tours_included" ADD CONSTRAINT "tours_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_included_locales" ADD CONSTRAINT "tours_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_not_included" ADD CONSTRAINT "tours_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_not_included_locales" ADD CONSTRAINT "tours_not_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours_not_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_itinerary" ADD CONSTRAINT "tours_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_itinerary_locales" ADD CONSTRAINT "tours_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours" ADD CONSTRAINT "tours_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tours" ADD CONSTRAINT "tours_booking_form_id_forms_id_fk" FOREIGN KEY ("booking_form_id") REFERENCES "payload"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tours_locales" ADD CONSTRAINT "tours_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tours_locales" ADD CONSTRAINT "tours_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_rels" ADD CONSTRAINT "tours_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_rels" ADD CONSTRAINT "tours_rels_stock_media_fk" FOREIGN KEY ("stock_media_id") REFERENCES "payload"."stock_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_rels" ADD CONSTRAINT "tours_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tours_rels" ADD CONSTRAINT "tours_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "payload"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_included" ADD CONSTRAINT "_tours_v_version_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_included_locales" ADD CONSTRAINT "_tours_v_version_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v_version_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_not_included" ADD CONSTRAINT "_tours_v_version_not_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_not_included_locales" ADD CONSTRAINT "_tours_v_version_not_included_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v_version_not_included"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_itinerary" ADD CONSTRAINT "_tours_v_version_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_version_itinerary_locales" ADD CONSTRAINT "_tours_v_version_itinerary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v_version_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v" ADD CONSTRAINT "_tours_v_parent_id_tours_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tours"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v" ADD CONSTRAINT "_tours_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v" ADD CONSTRAINT "_tours_v_version_booking_form_id_forms_id_fk" FOREIGN KEY ("version_booking_form_id") REFERENCES "payload"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_locales" ADD CONSTRAINT "_tours_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_locales" ADD CONSTRAINT "_tours_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_tours_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_rels" ADD CONSTRAINT "_tours_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_tours_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_rels" ADD CONSTRAINT "_tours_v_rels_stock_media_fk" FOREIGN KEY ("stock_media_id") REFERENCES "payload"."stock_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_rels" ADD CONSTRAINT "_tours_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v_rels" ADD CONSTRAINT "_tours_v_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "payload"."places"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_tours_order_idx" ON "payload"."pages_blocks_tours" USING btree ("_order");
  CREATE INDEX "pages_blocks_tours_parent_id_idx" ON "payload"."pages_blocks_tours" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_tours_path_idx" ON "payload"."pages_blocks_tours" USING btree ("_path");
  CREATE UNIQUE INDEX "pages_blocks_tours_locales_locale_parent_id_unique" ON "payload"."pages_blocks_tours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_blocks_tours_order_idx" ON "payload"."_pages_v_blocks_tours" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_tours_parent_id_idx" ON "payload"."_pages_v_blocks_tours" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_tours_path_idx" ON "payload"."_pages_v_blocks_tours" USING btree ("_path");
  CREATE UNIQUE INDEX "_pages_v_blocks_tours_locales_locale_parent_id_unique" ON "payload"."_pages_v_blocks_tours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "places_tenant_idx" ON "payload"."places" USING btree ("tenant_id");
  CREATE INDEX "places_kind_idx" ON "payload"."places" USING btree ("kind_id");
  CREATE INDEX "places_updated_at_idx" ON "payload"."places" USING btree ("updated_at");
  CREATE INDEX "places_created_at_idx" ON "payload"."places" USING btree ("created_at");
  CREATE UNIQUE INDEX "places_locales_locale_parent_id_unique" ON "payload"."places_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "platform_labels_type_idx" ON "payload"."platform_labels" USING btree ("type");
  CREATE INDEX "platform_labels_name_idx" ON "payload"."platform_labels" USING btree ("name");
  CREATE INDEX "platform_labels_updated_at_idx" ON "payload"."platform_labels" USING btree ("updated_at");
  CREATE INDEX "platform_labels_created_at_idx" ON "payload"."platform_labels" USING btree ("created_at");
  CREATE INDEX "stock_media_subject_idx" ON "payload"."stock_media" USING btree ("subject_id");
  CREATE INDEX "stock_media_updated_at_idx" ON "payload"."stock_media" USING btree ("updated_at");
  CREATE INDEX "stock_media_created_at_idx" ON "payload"."stock_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "stock_media_filename_idx" ON "payload"."stock_media" USING btree ("filename");
  CREATE INDEX "stock_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."stock_media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "stock_media_sizes_small_sizes_small_filename_idx" ON "payload"."stock_media" USING btree ("sizes_small_filename");
  CREATE INDEX "stock_media_sizes_medium_sizes_medium_filename_idx" ON "payload"."stock_media" USING btree ("sizes_medium_filename");
  CREATE INDEX "stock_media_sizes_large_sizes_large_filename_idx" ON "payload"."stock_media" USING btree ("sizes_large_filename");
  CREATE INDEX "stock_media_sizes_meta_sizes_meta_filename_idx" ON "payload"."stock_media" USING btree ("sizes_meta_filename");
  CREATE INDEX "tours_included_order_idx" ON "payload"."tours_included" USING btree ("_order");
  CREATE INDEX "tours_included_parent_id_idx" ON "payload"."tours_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tours_included_locales_locale_parent_id_unique" ON "payload"."tours_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_not_included_order_idx" ON "payload"."tours_not_included" USING btree ("_order");
  CREATE INDEX "tours_not_included_parent_id_idx" ON "payload"."tours_not_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tours_not_included_locales_locale_parent_id_unique" ON "payload"."tours_not_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_itinerary_order_idx" ON "payload"."tours_itinerary" USING btree ("_order");
  CREATE INDEX "tours_itinerary_parent_id_idx" ON "payload"."tours_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tours_itinerary_locales_locale_parent_id_unique" ON "payload"."tours_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_tenant_idx" ON "payload"."tours" USING btree ("tenant_id");
  CREATE INDEX "tours_booking_form_idx" ON "payload"."tours" USING btree ("booking_form_id");
  CREATE INDEX "tours_slug_idx" ON "payload"."tours" USING btree ("slug");
  CREATE INDEX "tours_updated_at_idx" ON "payload"."tours" USING btree ("updated_at");
  CREATE INDEX "tours_created_at_idx" ON "payload"."tours" USING btree ("created_at");
  CREATE INDEX "tours__status_idx" ON "payload"."tours" USING btree ("_status");
  CREATE INDEX "tours_meta_meta_image_idx" ON "payload"."tours_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "tours_locales_locale_parent_id_unique" ON "payload"."tours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tours_rels_order_idx" ON "payload"."tours_rels" USING btree ("order");
  CREATE INDEX "tours_rels_parent_idx" ON "payload"."tours_rels" USING btree ("parent_id");
  CREATE INDEX "tours_rels_path_idx" ON "payload"."tours_rels" USING btree ("path");
  CREATE INDEX "tours_rels_stock_media_id_idx" ON "payload"."tours_rels" USING btree ("stock_media_id");
  CREATE INDEX "tours_rels_media_id_idx" ON "payload"."tours_rels" USING btree ("media_id");
  CREATE INDEX "tours_rels_places_id_idx" ON "payload"."tours_rels" USING btree ("places_id");
  CREATE INDEX "_tours_v_version_included_order_idx" ON "payload"."_tours_v_version_included" USING btree ("_order");
  CREATE INDEX "_tours_v_version_included_parent_id_idx" ON "payload"."_tours_v_version_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_tours_v_version_included_locales_locale_parent_id_unique" ON "payload"."_tours_v_version_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tours_v_version_not_included_order_idx" ON "payload"."_tours_v_version_not_included" USING btree ("_order");
  CREATE INDEX "_tours_v_version_not_included_parent_id_idx" ON "payload"."_tours_v_version_not_included" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_tours_v_version_not_included_locales_locale_parent_id_uniqu" ON "payload"."_tours_v_version_not_included_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tours_v_version_itinerary_order_idx" ON "payload"."_tours_v_version_itinerary" USING btree ("_order");
  CREATE INDEX "_tours_v_version_itinerary_parent_id_idx" ON "payload"."_tours_v_version_itinerary" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_tours_v_version_itinerary_locales_locale_parent_id_unique" ON "payload"."_tours_v_version_itinerary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tours_v_parent_idx" ON "payload"."_tours_v" USING btree ("parent_id");
  CREATE INDEX "_tours_v_version_version_tenant_idx" ON "payload"."_tours_v" USING btree ("version_tenant_id");
  CREATE INDEX "_tours_v_version_version_booking_form_idx" ON "payload"."_tours_v" USING btree ("version_booking_form_id");
  CREATE INDEX "_tours_v_version_version_slug_idx" ON "payload"."_tours_v" USING btree ("version_slug");
  CREATE INDEX "_tours_v_version_version_updated_at_idx" ON "payload"."_tours_v" USING btree ("version_updated_at");
  CREATE INDEX "_tours_v_version_version_created_at_idx" ON "payload"."_tours_v" USING btree ("version_created_at");
  CREATE INDEX "_tours_v_version_version__status_idx" ON "payload"."_tours_v" USING btree ("version__status");
  CREATE INDEX "_tours_v_created_at_idx" ON "payload"."_tours_v" USING btree ("created_at");
  CREATE INDEX "_tours_v_updated_at_idx" ON "payload"."_tours_v" USING btree ("updated_at");
  CREATE INDEX "_tours_v_snapshot_idx" ON "payload"."_tours_v" USING btree ("snapshot");
  CREATE INDEX "_tours_v_published_locale_idx" ON "payload"."_tours_v" USING btree ("published_locale");
  CREATE INDEX "_tours_v_latest_idx" ON "payload"."_tours_v" USING btree ("latest");
  CREATE INDEX "_tours_v_autosave_idx" ON "payload"."_tours_v" USING btree ("autosave");
  CREATE INDEX "_tours_v_version_meta_version_meta_image_idx" ON "payload"."_tours_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_tours_v_locales_locale_parent_id_unique" ON "payload"."_tours_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_tours_v_rels_order_idx" ON "payload"."_tours_v_rels" USING btree ("order");
  CREATE INDEX "_tours_v_rels_parent_idx" ON "payload"."_tours_v_rels" USING btree ("parent_id");
  CREATE INDEX "_tours_v_rels_path_idx" ON "payload"."_tours_v_rels" USING btree ("path");
  CREATE INDEX "_tours_v_rels_stock_media_id_idx" ON "payload"."_tours_v_rels" USING btree ("stock_media_id");
  CREATE INDEX "_tours_v_rels_media_id_idx" ON "payload"."_tours_v_rels" USING btree ("media_id");
  CREATE INDEX "_tours_v_rels_places_id_idx" ON "payload"."_tours_v_rels" USING btree ("places_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_places_fk" FOREIGN KEY ("places_id") REFERENCES "payload"."places"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_platform_labels_fk" FOREIGN KEY ("platform_labels_id") REFERENCES "payload"."platform_labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stock_media_fk" FOREIGN KEY ("stock_media_id") REFERENCES "payload"."stock_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tours_fk" FOREIGN KEY ("tours_id") REFERENCES "payload"."tours"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_places_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("places_id");
  CREATE INDEX "payload_locked_documents_rels_platform_labels_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("platform_labels_id");
  CREATE INDEX "payload_locked_documents_rels_stock_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stock_media_id");
  CREATE INDEX "payload_locked_documents_rels_tours_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tours_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."pages_blocks_tours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."pages_blocks_tours_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_tours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_pages_v_blocks_tours_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."places" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."places_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."platform_labels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."stock_media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_included_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_not_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_not_included_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_itinerary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_itinerary_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tours_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_included_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_not_included" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_not_included_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_itinerary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_version_itinerary_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."_tours_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."pages_blocks_tours" CASCADE;
  DROP TABLE "payload"."pages_blocks_tours_locales" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_tours" CASCADE;
  DROP TABLE "payload"."_pages_v_blocks_tours_locales" CASCADE;
  DROP TABLE "payload"."places" CASCADE;
  DROP TABLE "payload"."places_locales" CASCADE;
  DROP TABLE "payload"."platform_labels" CASCADE;
  DROP TABLE "payload"."stock_media" CASCADE;
  DROP TABLE "payload"."tours_included" CASCADE;
  DROP TABLE "payload"."tours_included_locales" CASCADE;
  DROP TABLE "payload"."tours_not_included" CASCADE;
  DROP TABLE "payload"."tours_not_included_locales" CASCADE;
  DROP TABLE "payload"."tours_itinerary" CASCADE;
  DROP TABLE "payload"."tours_itinerary_locales" CASCADE;
  DROP TABLE "payload"."tours" CASCADE;
  DROP TABLE "payload"."tours_locales" CASCADE;
  DROP TABLE "payload"."tours_rels" CASCADE;
  DROP TABLE "payload"."_tours_v_version_included" CASCADE;
  DROP TABLE "payload"."_tours_v_version_included_locales" CASCADE;
  DROP TABLE "payload"."_tours_v_version_not_included" CASCADE;
  DROP TABLE "payload"."_tours_v_version_not_included_locales" CASCADE;
  DROP TABLE "payload"."_tours_v_version_itinerary" CASCADE;
  DROP TABLE "payload"."_tours_v_version_itinerary_locales" CASCADE;
  DROP TABLE "payload"."_tours_v" CASCADE;
  DROP TABLE "payload"."_tours_v_locales" CASCADE;
  DROP TABLE "payload"."_tours_v_rels" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_places_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_platform_labels_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stock_media_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tours_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_places_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_platform_labels_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_stock_media_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_tours_id_idx";
  ALTER TABLE "payload"."site_settings_footer_contact" ALTER COLUMN "platform" DROP NOT NULL;
  ALTER TABLE "payload"."forms_blocks_number" DROP COLUMN "min";
  ALTER TABLE "payload"."forms_blocks_number" DROP COLUMN "max";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "places_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "platform_labels_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "stock_media_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "tours_id";
  DROP TYPE "payload"."enum_platform_labels_type";
  DROP TYPE "payload"."enum_tours_intent";
  DROP TYPE "payload"."enum_tours_currency";
  DROP TYPE "payload"."enum_tours_status";
  DROP TYPE "payload"."enum__tours_v_version_status";
  DROP TYPE "payload"."enum__tours_v_published_locale";`);
}
