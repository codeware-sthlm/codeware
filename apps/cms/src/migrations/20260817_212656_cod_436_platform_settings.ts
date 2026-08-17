import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."platform_settings_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"hostname" varchar NOT NULL,
  	"app" varchar NOT NULL,
  	"is_primary" boolean,
  	"certificate_is_configured" boolean,
  	"certificate_is_apex" boolean,
  	"certificate_status" varchar,
  	"certificate_checked_at" timestamp(3) with time zone,
  	"certificate_dns_validation_hostname" varchar,
  	"certificate_dns_validation_target" varchar,
  	"certificate_dns_validation_instructions" varchar,
  	"certificate_rate_limited_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."platform_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."platform_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "platform_settings_id" integer;
  ALTER TABLE "payload"."platform_settings_domains" ADD CONSTRAINT "platform_settings_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."platform_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."platform_settings_texts" ADD CONSTRAINT "platform_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."platform_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "platform_settings_domains_order_idx" ON "payload"."platform_settings_domains" USING btree ("_order");
  CREATE INDEX "platform_settings_domains_parent_id_idx" ON "payload"."platform_settings_domains" USING btree ("_parent_id");
  CREATE INDEX "platform_settings_updated_at_idx" ON "payload"."platform_settings" USING btree ("updated_at");
  CREATE INDEX "platform_settings_created_at_idx" ON "payload"."platform_settings" USING btree ("created_at");
  CREATE INDEX "platform_settings_texts_order_parent" ON "payload"."platform_settings_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_platform_settings_fk" FOREIGN KEY ("platform_settings_id") REFERENCES "payload"."platform_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_platform_settings_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("platform_settings_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."platform_settings_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."platform_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."platform_settings_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."platform_settings_domains" CASCADE;
  DROP TABLE "payload"."platform_settings" CASCADE;
  DROP TABLE "payload"."platform_settings_texts" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_platform_settings_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_platform_settings_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "platform_settings_id";`);
}
