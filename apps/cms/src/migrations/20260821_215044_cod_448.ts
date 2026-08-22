import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "payload"."enum_form_submissions_notification_status" ADD VALUE 'not-configured' BEFORE 'sent';
  ALTER TYPE "payload"."enum_form_submissions_notification_status" ADD VALUE 'no-recipient' BEFORE 'sent';
  CREATE TABLE "payload"."site_settings_forms_notification_recipients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL
  );
  
  ALTER TABLE "payload"."site_settings_forms_notification_recipients" ADD CONSTRAINT "site_settings_forms_notification_recipients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_forms_notification_recipients_order_idx" ON "payload"."site_settings_forms_notification_recipients" USING btree ("_order");
  CREATE INDEX "site_settings_forms_notification_recipients_parent_id_idx" ON "payload"."site_settings_forms_notification_recipients" USING btree ("_parent_id");`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_settings_forms_notification_recipients" CASCADE;
  ALTER TABLE "payload"."form_submissions" ALTER COLUMN "notification_status" SET DATA TYPE text;
  DROP TYPE "payload"."enum_form_submissions_notification_status";
  CREATE TYPE "payload"."enum_form_submissions_notification_status" AS ENUM('sent', 'failed');
  ALTER TABLE "payload"."form_submissions" ALTER COLUMN "notification_status" SET DATA TYPE "payload"."enum_form_submissions_notification_status" USING "notification_status"::"payload"."enum_form_submissions_notification_status";`);
}
