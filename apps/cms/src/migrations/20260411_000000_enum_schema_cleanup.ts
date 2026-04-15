import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Originally moved all enum types from the `public` schema into the `payload`
 * schema. Production was patched successfully so this is now a no-op, making
 * it safe to run on fresh databases where the enums were always in `payload`.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT 1`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1`);
}
