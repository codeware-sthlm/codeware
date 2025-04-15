import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Rename existing enum types
    ALTER TYPE "public"."enum_cards_link_type" RENAME TO "enum_link_type";
    ALTER TYPE "public"."enum_cards_link_nav_trigger" RENAME TO "enum_nav_trigger";
    ALTER TYPE "public"."enum_navigation_items_label_source" RENAME TO "enum_navigation_label_source";
    ALTER TYPE "public"."enum_pages_blocks_content_columns_size" RENAME TO "enum_content_column_size";
    ALTER TYPE "public"."enum_pages_blocks_code_language" RENAME TO "enum_code_language";
    ALTER TYPE "public"."enum_tenants_domains_page_types" RENAME TO "enum_tenant_domain_page_type";
    ALTER TYPE "public"."enum_users_tenants_role" RENAME TO "enum_tenant_user_role";
    ALTER TYPE "public"."enum_users_role" RENAME TO "enum_user_role";

    -- Drop default before casting enums on tables with altered enums
    ALTER TABLE "pages_blocks_card_custom_cards" ALTER COLUMN "card_link_type" DROP DEFAULT,
                                                 ALTER COLUMN "card_link_type" TYPE "enum_link_type" USING ("card_link_type"::text::"enum_link_type");
    ALTER TABLE "pages_blocks_card_custom_cards" ALTER COLUMN "card_link_nav_trigger" DROP DEFAULT,
                                                 ALTER COLUMN "card_link_nav_trigger" TYPE "enum_nav_trigger" USING ("card_link_nav_trigger"::text::"enum_nav_trigger");

    -- Drop deprecated enums
    DROP TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_type";
    DROP TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_nav_trigger";
  `);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Create the deprecated enum types
    CREATE TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_type" AS ENUM('reference', 'custom');
    CREATE TYPE "public"."enum_pages_blocks_card_custom_cards_card_link_nav_trigger" AS ENUM('card', 'link');

    -- Rename current enums to old names
    ALTER TYPE "public"."enum_link_type" RENAME TO "enum_cards_link_type";
    ALTER TYPE "public"."enum_nav_trigger" RENAME TO "enum_cards_link_nav_trigger";
    ALTER TYPE "public"."enum_navigation_label_source" RENAME TO "enum_navigation_items_label_source";
    ALTER TYPE "public"."enum_content_column_size" RENAME TO "enum_pages_blocks_content_columns_size";
    ALTER TYPE "public"."enum_code_language" RENAME TO "enum_pages_blocks_code_language";
    ALTER TYPE "public"."enum_tenant_domain_page_type" RENAME TO "enum_tenants_domains_page_types";
    ALTER TYPE "public"."enum_tenant_user_role" RENAME TO "enum_users_tenants_role";
    ALTER TYPE "public"."enum_user_role" RENAME TO "enum_users_role";

    -- Drop default before cast on tables with altered enums
    ALTER TABLE "pages_blocks_card_custom_cards" ALTER COLUMN "card_link_type" DROP DEFAULT,
                                                 ALTER COLUMN "card_link_type" TYPE "enum_pages_blocks_card_custom_cards_card_link_type" USING ("card_link_type"::text::"enum_pages_blocks_card_custom_cards_card_link_type");
    ALTER TABLE "pages_blocks_card_custom_cards" ALTER COLUMN "card_link_nav_trigger" DROP DEFAULT,
                                                 ALTER COLUMN "card_link_nav_trigger" TYPE "enum_pages_blocks_card_custom_cards_card_link_nav_trigger" USING ("card_link_nav_trigger"::text::"enum_pages_blocks_card_custom_cards_card_link_nav_trigger");
  `);
}
