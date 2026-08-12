import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_tour_signups_status" AS ENUM('booked', 'waiting', 'cancelled');
  CREATE TYPE "payload"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'anonymize-tour-signups');
  CREATE TYPE "payload"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "payload"."enum_payload_jobs_task_slug" AS ENUM('inline', 'anonymize-tour-signups');
  CREATE TABLE "payload"."site_settings_tour_signups_notification_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );

  CREATE TABLE "payload"."tour_signups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"tour_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"people" numeric DEFAULT 1 NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"status" "payload"."enum_tour_signups_status" DEFAULT 'booked' NOT NULL,
  	"queue_position" numeric,
  	"notes" varchar,
  	"status_changed_at" timestamp(3) with time zone,
  	"terms_accepted_at" timestamp(3) with time zone,
  	"anonymized_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "payload"."enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "payload"."enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );

  CREATE TABLE "payload"."payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "payload"."enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "payload"."tours" DROP CONSTRAINT "tours_booking_form_id_forms_id_fk";

  ALTER TABLE "payload"."_tours_v" DROP CONSTRAINT "_tours_v_version_booking_form_id_forms_id_fk";

  DROP INDEX "payload"."tours_booking_form_idx";
  DROP INDEX "payload"."_tours_v_version_version_booking_form_idx";
  ALTER TABLE "payload"."site_settings" ADD COLUMN "tour_signups_privacy_page_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "tour_signups_terms_page_id" integer;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "tour_signups_retention_days" numeric DEFAULT 365;
  ALTER TABLE "payload"."tours" ADD COLUMN "max_customers" numeric;
  ALTER TABLE "payload"."tours" ADD COLUMN "signups_closed" boolean DEFAULT false;
  ALTER TABLE "payload"."_tours_v" ADD COLUMN "version_max_customers" numeric;
  ALTER TABLE "payload"."_tours_v" ADD COLUMN "version_signups_closed" boolean DEFAULT false;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "tour_signups_id" integer;
  ALTER TABLE "payload"."site_settings_tour_signups_notification_recipients" ADD CONSTRAINT "site_settings_tour_signups_notification_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tour_signups" ADD CONSTRAINT "tour_signups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."tour_signups" ADD CONSTRAINT "tour_signups_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "payload"."tours"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_tour_signups_notification_recipients_order_idx" ON "payload"."site_settings_tour_signups_notification_recipients" USING btree ("_order");
  CREATE INDEX "site_settings_tour_signups_notification_recipients_parent_id_idx" ON "payload"."site_settings_tour_signups_notification_recipients" USING btree ("_parent_id");
  CREATE INDEX "tour_signups_tenant_idx" ON "payload"."tour_signups" USING btree ("tenant_id");
  CREATE INDEX "tour_signups_tour_idx" ON "payload"."tour_signups" USING btree ("tour_id");
  CREATE INDEX "tour_signups_status_idx" ON "payload"."tour_signups" USING btree ("status");
  CREATE INDEX "tour_signups_queue_position_idx" ON "payload"."tour_signups" USING btree ("queue_position");
  CREATE INDEX "tour_signups_updated_at_idx" ON "payload"."tour_signups" USING btree ("updated_at");
  CREATE INDEX "tour_signups_created_at_idx" ON "payload"."tour_signups" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload"."payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload"."payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload"."payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload"."payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload"."payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload"."payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload"."payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload"."payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload"."payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload"."payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload"."payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_tour_signups_privacy_page_id_pages_id_fk" FOREIGN KEY ("tour_signups_privacy_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_tour_signups_terms_page_id_pages_id_fk" FOREIGN KEY ("tour_signups_terms_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tour_signups_fk" FOREIGN KEY ("tour_signups_id") REFERENCES "payload"."tour_signups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_tour_signups_tour_signups_privacy_page_idx" ON "payload"."site_settings" USING btree ("tour_signups_privacy_page_id");
  CREATE INDEX "site_settings_tour_signups_tour_signups_terms_page_idx" ON "payload"."site_settings" USING btree ("tour_signups_terms_page_id");
  CREATE INDEX "payload_locked_documents_rels_tour_signups_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tour_signups_id");
  ALTER TABLE "payload"."tours" DROP COLUMN "booking_form_id";
  ALTER TABLE "payload"."_tours_v" DROP COLUMN "version_booking_form_id";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings_tour_signups_notification_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."tour_signups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."site_settings_tour_signups_notification_recipients" CASCADE;
  DROP TABLE "payload"."tour_signups" CASCADE;
  DROP TABLE "payload"."payload_jobs_log" CASCADE;
  DROP TABLE "payload"."payload_jobs" CASCADE;
  DROP TABLE "payload"."payload_jobs_stats" CASCADE;
  ALTER TABLE "payload"."site_settings" DROP CONSTRAINT IF EXISTS "site_settings_tour_signups_privacy_page_id_pages_id_fk";

  ALTER TABLE "payload"."site_settings" DROP CONSTRAINT IF EXISTS "site_settings_tour_signups_terms_page_id_pages_id_fk";

  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tour_signups_fk";

  DROP INDEX IF EXISTS "payload"."site_settings_tour_signups_tour_signups_privacy_page_idx";
  DROP INDEX IF EXISTS "payload"."site_settings_tour_signups_tour_signups_terms_page_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_tour_signups_id_idx";
  ALTER TABLE "payload"."tours" ADD COLUMN "booking_form_id" integer;
  ALTER TABLE "payload"."_tours_v" ADD COLUMN "version_booking_form_id" integer;
  ALTER TABLE "payload"."tours" ADD CONSTRAINT "tours_booking_form_id_forms_id_fk" FOREIGN KEY ("booking_form_id") REFERENCES "payload"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_tours_v" ADD CONSTRAINT "_tours_v_version_booking_form_id_forms_id_fk" FOREIGN KEY ("version_booking_form_id") REFERENCES "payload"."forms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tours_booking_form_idx" ON "payload"."tours" USING btree ("booking_form_id");
  CREATE INDEX "_tours_v_version_version_booking_form_idx" ON "payload"."_tours_v" USING btree ("version_booking_form_id");
  ALTER TABLE "payload"."site_settings" DROP COLUMN "tour_signups_privacy_page_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "tour_signups_terms_page_id";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "tour_signups_retention_days";
  ALTER TABLE "payload"."tours" DROP COLUMN "max_customers";
  ALTER TABLE "payload"."tours" DROP COLUMN "signups_closed";
  ALTER TABLE "payload"."_tours_v" DROP COLUMN "version_max_customers";
  ALTER TABLE "payload"."_tours_v" DROP COLUMN "version_signups_closed";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "tour_signups_id";
  DROP TYPE "payload"."enum_tour_signups_status";
  DROP TYPE "payload"."enum_payload_jobs_log_task_slug";
  DROP TYPE "payload"."enum_payload_jobs_log_state";
  DROP TYPE "payload"."enum_payload_jobs_task_slug";`);
}
