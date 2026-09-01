import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."custom_themes" ADD COLUMN "recipe" jsonb;
  ALTER TABLE "payload"."custom_themes" ADD COLUMN "overrides" jsonb;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."custom_themes" DROP COLUMN "recipe";
  ALTER TABLE "payload"."custom_themes" DROP COLUMN "overrides";`);
}
