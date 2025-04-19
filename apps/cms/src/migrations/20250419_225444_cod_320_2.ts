import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_media_direction" AS ENUM('horizontal', 'vertical');
  ALTER TABLE "pages_blocks_social_media_social" ADD COLUMN "with_label" boolean;
  ALTER TABLE "pages_blocks_social_media_social" ADD COLUMN "label" varchar;
  ALTER TABLE "pages_blocks_social_media" ADD COLUMN "direction" "enum_social_media_direction" DEFAULT 'horizontal';
  ALTER TABLE "reusable_content_blocks_social_media_social" ADD COLUMN "with_label" boolean;
  ALTER TABLE "reusable_content_blocks_social_media_social" ADD COLUMN "label" varchar;
  ALTER TABLE "reusable_content_blocks_social_media" ADD COLUMN "direction" "enum_social_media_direction" DEFAULT 'horizontal';`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_social_media_social" DROP COLUMN IF EXISTS "with_label";
  ALTER TABLE "pages_blocks_social_media_social" DROP COLUMN IF EXISTS "label";
  ALTER TABLE "pages_blocks_social_media" DROP COLUMN IF EXISTS "direction";
  ALTER TABLE "reusable_content_blocks_social_media_social" DROP COLUMN IF EXISTS "with_label";
  ALTER TABLE "reusable_content_blocks_social_media_social" DROP COLUMN IF EXISTS "label";
  ALTER TABLE "reusable_content_blocks_social_media" DROP COLUMN IF EXISTS "direction";
  DROP TYPE "public"."enum_social_media_direction";`);
}
