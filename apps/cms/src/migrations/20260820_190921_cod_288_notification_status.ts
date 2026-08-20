import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_form_submissions_notification_status" AS ENUM('sent', 'failed');
  ALTER TABLE "payload"."form_submissions" ADD COLUMN "notification_status" "payload"."enum_form_submissions_notification_status";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."form_submissions" DROP COLUMN "notification_status";
  DROP TYPE "payload"."enum_form_submissions_notification_status";`);
}
