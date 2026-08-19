import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."platform_settings_domains_certificate_issued_certificates" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" varchar,
  	"expires_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."tenants_domains_certificate_issued_certificates" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" varchar,
  	"expires_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."platform_settings_domains" ADD COLUMN "certificate_certificate_authority" varchar;
  ALTER TABLE "payload"."tenants_domains" ADD COLUMN "certificate_certificate_authority" varchar;
  ALTER TABLE "payload"."platform_settings_domains_certificate_issued_certificates" ADD CONSTRAINT "platform_settings_domains_certificate_issued_certificates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."platform_settings_domains"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tenants_domains_certificate_issued_certificates" ADD CONSTRAINT "tenants_domains_certificate_issued_certificates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tenants_domains"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "platform_settings_domains_certificate_issued_certificates_order_idx" ON "payload"."platform_settings_domains_certificate_issued_certificates" USING btree ("_order");
  CREATE INDEX "platform_settings_domains_certificate_issued_certificates_parent_id_idx" ON "payload"."platform_settings_domains_certificate_issued_certificates" USING btree ("_parent_id");
  CREATE INDEX "tenants_domains_certificate_issued_certificates_order_idx" ON "payload"."tenants_domains_certificate_issued_certificates" USING btree ("_order");
  CREATE INDEX "tenants_domains_certificate_issued_certificates_parent_id_idx" ON "payload"."tenants_domains_certificate_issued_certificates" USING btree ("_parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."platform_settings_domains_certificate_issued_certificates" CASCADE;
  DROP TABLE "payload"."tenants_domains_certificate_issued_certificates" CASCADE;
  ALTER TABLE "payload"."platform_settings_domains" DROP COLUMN "certificate_certificate_authority";
  ALTER TABLE "payload"."tenants_domains" DROP COLUMN "certificate_certificate_authority";`);
}
