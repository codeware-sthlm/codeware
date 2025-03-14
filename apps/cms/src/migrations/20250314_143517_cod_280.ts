import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_tenants" ALTER COLUMN "tenant_id" SET NOT NULL;
  ALTER TABLE "users_tenants" ALTER COLUMN "role" SET NOT NULL;
  ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_tenants" ALTER COLUMN "tenant_id" DROP NOT NULL;
  ALTER TABLE "users_tenants" ALTER COLUMN "role" DROP NOT NULL;
  ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;`);
}
