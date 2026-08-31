import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."custom_themes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" integer,
  	"name" varchar NOT NULL,
  	"tokens_light" jsonb NOT NULL,
  	"tokens_dark" jsonb,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "custom_themes_id" integer;
  ALTER TABLE "payload"."custom_themes" ADD CONSTRAINT "custom_themes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "payload"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "custom_themes_tenant_idx" ON "payload"."custom_themes" USING btree ("tenant_id");
  CREATE INDEX "custom_themes_slug_idx" ON "payload"."custom_themes" USING btree ("slug");
  CREATE INDEX "custom_themes_updated_at_idx" ON "payload"."custom_themes" USING btree ("updated_at");
  CREATE INDEX "custom_themes_created_at_idx" ON "payload"."custom_themes" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_custom_themes_fk" FOREIGN KEY ("custom_themes_id") REFERENCES "payload"."custom_themes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_custom_themes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("custom_themes_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."custom_themes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."custom_themes" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_custom_themes_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_custom_themes_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "custom_themes_id";`);
}
