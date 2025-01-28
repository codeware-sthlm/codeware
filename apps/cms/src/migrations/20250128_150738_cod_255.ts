import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from 'drizzle-orm';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

ALTER TABLE "pages_locales" RENAME COLUMN "title" TO "name";`);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

ALTER TABLE "pages_locales" RENAME COLUMN "name" TO "title";`);
}
