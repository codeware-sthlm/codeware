import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_social_media_platform" ADD VALUE 'email' BEFORE 'facebook';
  ALTER TYPE "public"."enum_social_media_platform" ADD VALUE 'phone' BEFORE 'web';
  ALTER TABLE "pages_blocks_social_media_social" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "reusable_content_blocks_social_media_social" ALTER COLUMN "url" DROP NOT NULL;
  ALTER TABLE "pages_blocks_social_media_social" ADD COLUMN "email" varchar;
  ALTER TABLE "pages_blocks_social_media_social" ADD COLUMN "phone" varchar;
  ALTER TABLE "reusable_content_blocks_social_media_social" ADD COLUMN "email" varchar;
  ALTER TABLE "reusable_content_blocks_social_media_social" ADD COLUMN "phone" varchar;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- Pre-migration: Remove entries with platforms 'email' and 'phone' before dropping columns
  DELETE FROM "pages_blocks_social_media_social" WHERE "platform" IN ('email', 'phone');
  DELETE FROM "reusable_content_blocks_social_media_social" WHERE "platform" IN ('email', 'phone');

  -- Now proceed with the auto-generated migration
  ALTER TABLE "pages_blocks_social_media_social" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "reusable_content_blocks_social_media_social" ALTER COLUMN "url" SET NOT NULL;
  ALTER TABLE "pages_blocks_social_media_social" DROP COLUMN IF EXISTS "email";
  ALTER TABLE "pages_blocks_social_media_social" DROP COLUMN IF EXISTS "phone";
  ALTER TABLE "reusable_content_blocks_social_media_social" DROP COLUMN IF EXISTS "email";
  ALTER TABLE "reusable_content_blocks_social_media_social" DROP COLUMN IF EXISTS "phone";
  ALTER TABLE "public"."pages_blocks_social_media_social" ALTER COLUMN "platform" SET DATA TYPE text;
  ALTER TABLE "public"."reusable_content_blocks_social_media_social" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_social_media_platform";
  CREATE TYPE "public"."enum_social_media_platform" AS ENUM('discord', 'facebook', 'github', 'instagram', 'linkedin', 'npm', 'web', 'x', 'youtube');
  ALTER TABLE "public"."pages_blocks_social_media_social" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_social_media_platform" USING "platform"::"public"."enum_social_media_platform";
  ALTER TABLE "public"."reusable_content_blocks_social_media_social" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_social_media_platform" USING "platform"::"public"."enum_social_media_platform";`);
}
