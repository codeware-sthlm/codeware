import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from 'drizzle-orm';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

ALTER TABLE "articles" DROP COLUMN IF EXISTS "content_html";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "content_html";
ALTER TABLE "pages" DROP COLUMN IF EXISTS "intro_html";
ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "intro";`);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`

ALTER TABLE "articles" ADD COLUMN "content_html" varchar;
ALTER TABLE "pages" ADD COLUMN "content_html" varchar;
ALTER TABLE "pages" ADD COLUMN "intro_html" varchar;
ALTER TABLE "pages_locales" ADD COLUMN "intro" jsonb;`);
}
