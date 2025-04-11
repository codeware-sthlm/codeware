import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cards" RENAME COLUMN "icon" TO "brand_icon";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "card_icon" TO "card_brand_icon";
  ALTER TABLE "cards" ADD COLUMN "brand_color" varchar;
  ALTER TABLE "pages_blocks_card_custom_cards" ADD COLUMN "card_brand_color" varchar;`);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cards" RENAME COLUMN "brand_icon" TO "icon";
  ALTER TABLE "pages_blocks_card_custom_cards" RENAME COLUMN "card_brand_icon" TO "card_icon";
  ALTER TABLE "cards" DROP COLUMN IF EXISTS "brand_color";
  ALTER TABLE "pages_blocks_card_custom_cards" DROP COLUMN IF EXISTS "card_brand_color";`);
}
