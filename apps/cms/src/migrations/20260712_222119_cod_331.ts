import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload"."faq_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );

  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "faq_id" integer;
  ALTER TABLE "payload"."faq_locales" ADD CONSTRAINT "faq_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."faq"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "faq__order_idx" ON "payload"."faq" USING btree ("_order");
  CREATE INDEX "faq_updated_at_idx" ON "payload"."faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "payload"."faq" USING btree ("created_at");
  CREATE UNIQUE INDEX "faq_locales_locale_parent_id_unique" ON "payload"."faq_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "payload"."faq"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("faq_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."faq_locales" DISABLE ROW LEVEL SECURITY;

  -- Detach the locked documents relation before dropping the tables,
  -- since "DROP TABLE ... CASCADE" would remove the foreign key itself
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_fk";
  DROP INDEX "payload"."payload_locked_documents_rels_faq_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "faq_id";

  DROP TABLE "payload"."faq_locales" CASCADE;
  DROP TABLE "payload"."faq" CASCADE;`);
}
