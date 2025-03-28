import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- Add temporary numeric columns
  ALTER TABLE "forms_blocks_checkbox" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_country" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_email" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_number" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_select" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_text" ADD COLUMN "width_numeric" numeric;
  ALTER TABLE "forms_blocks_textarea" ADD COLUMN "width_numeric" numeric;

  -- Convert enum values to numeric, capping at 6
  UPDATE "forms_blocks_checkbox" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_country" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_email" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_number" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_select" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_text" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);
  UPDATE "forms_blocks_textarea" SET "width_numeric" = LEAST(CAST(CAST("width" AS text) AS numeric), 6);

  -- Drop the original enum columns
  ALTER TABLE "forms_blocks_checkbox" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_country" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_email" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_number" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_select" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_text" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_textarea" DROP COLUMN "width";

  -- Rename the numeric columns to the original names
  ALTER TABLE "forms_blocks_checkbox" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_country" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_email" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_number" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_select" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_text" RENAME COLUMN "width_numeric" TO "width";
  ALTER TABLE "forms_blocks_textarea" RENAME COLUMN "width_numeric" TO "width";

  -- Drop the now-unused enum types
  DROP TYPE "public"."enum_forms_blocks_checkbox_width";
  DROP TYPE "public"."enum_forms_blocks_country_width";
  DROP TYPE "public"."enum_forms_blocks_email_width";
  DROP TYPE "public"."enum_forms_blocks_number_width";
  DROP TYPE "public"."enum_forms_blocks_select_width";
  DROP TYPE "public"."enum_forms_blocks_text_width";
  DROP TYPE "public"."enum_forms_blocks_textarea_width";`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  -- First recreate the enum types
  CREATE TYPE "public"."enum_forms_blocks_checkbox_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_country_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_email_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_number_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_select_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_text_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');
  CREATE TYPE "public"."enum_forms_blocks_textarea_width" AS ENUM('1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12');

  -- Add temporary enum columns
  ALTER TABLE "forms_blocks_checkbox" ADD COLUMN "width_enum" enum_forms_blocks_checkbox_width;
  ALTER TABLE "forms_blocks_country" ADD COLUMN "width_enum" enum_forms_blocks_country_width;
  ALTER TABLE "forms_blocks_email" ADD COLUMN "width_enum" enum_forms_blocks_email_width;
  ALTER TABLE "forms_blocks_number" ADD COLUMN "width_enum" enum_forms_blocks_number_width;
  ALTER TABLE "forms_blocks_select" ADD COLUMN "width_enum" enum_forms_blocks_select_width;
  ALTER TABLE "forms_blocks_text" ADD COLUMN "width_enum" enum_forms_blocks_text_width;
  ALTER TABLE "forms_blocks_textarea" ADD COLUMN "width_enum" enum_forms_blocks_textarea_width;

  -- Convert numeric values to enum, ensuring they are valid enum values
  UPDATE "forms_blocks_checkbox" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_checkbox_width);
  UPDATE "forms_blocks_country" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_country_width);
  UPDATE "forms_blocks_email" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_email_width);
  UPDATE "forms_blocks_number" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_number_width);
  UPDATE "forms_blocks_select" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_select_width);
  UPDATE "forms_blocks_text" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_text_width);
  UPDATE "forms_blocks_textarea" SET "width_enum" = CAST(CAST(LEAST("width", 6) AS text) AS enum_forms_blocks_textarea_width);

  -- Drop the numeric columns
  ALTER TABLE "forms_blocks_checkbox" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_country" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_email" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_number" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_select" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_text" DROP COLUMN "width";
  ALTER TABLE "forms_blocks_textarea" DROP COLUMN "width";

  -- Rename the enum columns to the original names
  ALTER TABLE "forms_blocks_checkbox" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_country" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_email" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_number" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_select" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_text" RENAME COLUMN "width_enum" TO "width";
  ALTER TABLE "forms_blocks_textarea" RENAME COLUMN "width_enum" TO "width";

  -- Set default values
  ALTER TABLE "forms_blocks_checkbox" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_country" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_email" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_number" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_select" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_text" ALTER COLUMN "width" SET DEFAULT '12';
  ALTER TABLE "forms_blocks_textarea" ALTER COLUMN "width" SET DEFAULT '12';`);
}
