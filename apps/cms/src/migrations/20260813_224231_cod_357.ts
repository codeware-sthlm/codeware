import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."tenants_domains" (
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
  
  ALTER TABLE "payload"."tenants_domains" ADD CONSTRAINT "tenants_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_domains_order_idx" ON "payload"."tenants_domains" USING btree ("_order");
  CREATE INDEX "tenants_domains_parent_id_idx" ON "payload"."tenants_domains" USING btree ("_parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."tenants_domains" CASCADE;`);
}
