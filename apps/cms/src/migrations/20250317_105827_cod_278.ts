import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_domains_page_types" AS ENUM('cms', 'client', 'disabled');
  CREATE TABLE IF NOT EXISTS "tenants_domains_page_types" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_tenants_domains_page_types",
  	"id" serial PRIMARY KEY NOT NULL
  );

  DO $$ BEGIN
   ALTER TABLE "tenants_domains_page_types" ADD CONSTRAINT "tenants_domains_page_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants_domains"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;

  CREATE INDEX IF NOT EXISTS "tenants_domains_page_types_order_idx" ON "tenants_domains_page_types" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "tenants_domains_page_types_parent_idx" ON "tenants_domains_page_types" USING btree ("parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants_domains_page_types" CASCADE;
  DROP TYPE "public"."enum_tenants_domains_page_types";`);
}
