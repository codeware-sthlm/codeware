import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."tenants_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

  ALTER TABLE "payload"."tenants_texts" ADD CONSTRAINT "tenants_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_texts_order_parent" ON "payload"."tenants_texts" USING btree ("order","parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."tenants_texts" CASCADE;`);
}
